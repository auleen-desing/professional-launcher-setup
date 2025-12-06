const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { sql, poolPromise } = require('../config/database');
const { generateToken, authMiddleware } = require('../middleware/auth');
const { 
  authRateLimit, 
  recordFailedLogin, 
  isLoginAllowed, 
  clearLoginAttempts,
  getClientIP 
} = require('../middleware/security');

// SHA512 hash function (NosTale standard)
function sha512(password) {
  return crypto.createHash('sha512').update(password, 'utf8').digest('hex');
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

// Validate username format
function isValidUsername(username) {
  // Only alphanumeric and underscore, 3-20 chars
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

// POST /api/auth/login - with brute force protection
router.post('/login', authRateLimit, async (req, res) => {
  const ip = getClientIP(req);
  
  try {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid input format' });
    }

    // Check if login is allowed (brute force protection)
    const loginStatus = isLoginAllowed(username, ip);
    if (!loginStatus.allowed) {
      console.log(`[SECURITY] Login blocked for ${username} from ${ip} - account locked`);
      return res.status(429).json({ 
        success: false, 
        error: `Account temporarily locked. Try again in ${Math.ceil(loginStatus.waitSeconds / 60)} minutes.`,
        locked: true
      });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('username', sql.NVarChar, username.substring(0, 20)) // Limit length
      .query(`
        SELECT AccountId, Name, Password, Authority, Email, coins
        FROM Account 
        WHERE Name = @username
      `);

    // Use same error message for both cases (prevent username enumeration)
    if (result.recordset.length === 0) {
      recordFailedLogin(username, ip);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials',
        remainingAttempts: loginStatus.remainingAttempts - 1
      });
    }

    const user = result.recordset[0];

    // Check if user is banned
    if (user.Authority === -1) {
      return res.status(403).json({ success: false, error: 'This account has been banned' });
    }

    // Compare SHA512 hashed password using timing-safe comparison
    const hashedPassword = sha512(password);
    let isValidPassword = false;
    
    try {
      isValidPassword = crypto.timingSafeEqual(
        Buffer.from(hashedPassword.toLowerCase()),
        Buffer.from(user.Password.toLowerCase())
      );
    } catch (e) {
      // Lengths don't match
      isValidPassword = false;
    }

    if (!isValidPassword) {
      const failResult = recordFailedLogin(username, ip);
      console.log(`[SECURITY] Failed login attempt for ${username} from ${ip}`);
      
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials',
        remainingAttempts: failResult.remainingAttempts,
        locked: failResult.locked
      });
    }

    // Successful login - clear failed attempts
    clearLoginAttempts(username, ip);
    
    const token = generateToken(user);

    console.log(`[AUTH] Successful login: ${username} from ${ip}`);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.AccountId,
          username: user.Name,
          email: user.Email || '',
          coins: user.coins || 0,
          authority: user.Authority || 0
        }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    // Don't leak error details
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/auth/register - with rate limiting and validation
router.post('/register', authRateLimit, async (req, res) => {
  const ip = getClientIP(req);
  
  try {
    const { username, password, email } = req.body;

    // Input validation
    if (!username || !password || !email) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    if (typeof username !== 'string' || typeof password !== 'string' || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid input format' });
    }

    // Validate username format
    if (!isValidUsername(username)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' 
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    if (password.length > 100) {
      return res.status(400).json({ success: false, error: 'Password too long' });
    }

    // Check for common weak passwords
    const weakPasswords = ['123456', 'password', 'qwerty', '123456789', 'abc123'];
    if (weakPasswords.includes(password.toLowerCase())) {
      return res.status(400).json({ success: false, error: 'Password too weak. Choose a stronger password.' });
    }

    const pool = await poolPromise;
    
    // Check if user or email exists (prevent enumeration by checking both)
    const existing = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email.toLowerCase())
      .query('SELECT AccountId FROM Account WHERE Name = @username OR LOWER(Email) = @email');

    if (existing.recordset.length > 0) {
      return res.status(400).json({ success: false, error: 'Username or email already exists' });
    }

    // Hash password with SHA512
    const hashedPassword = sha512(password);

    // Get registration IP
    const registrationIP = ip.substring(0, 45); // Limit IP length

    // Insert new user
    await pool.request()
      .input('username', sql.NVarChar, username)
      .input('password', sql.VarChar, hashedPassword)
      .input('email', sql.NVarChar, email.toLowerCase())
      .input('registrationIP', sql.VarChar, registrationIP)
      .query(`
        INSERT INTO Account (Name, Password, Email, Authority, ReferrerId, IsConnected, coins, DailyRewardSent, CanUseCP, RegistrationIP, RegistrationDate)
        VALUES (@username, @password, @email, 0, 0, 0, 0, 0, 0, @registrationIP, GETDATE())
      `);

    console.log(`[AUTH] New registration: ${username} from ${ip}`);

    res.json({ success: true, message: 'Account created successfully' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/auth/session
router.get('/session', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.BigInt, req.user.id)
      .query('SELECT AccountId, Name, Email, Authority, coins FROM Account WHERE AccountId = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const user = result.recordset[0];
    
    // Check if banned
    if (user.Authority === -1) {
      return res.status(403).json({ success: false, error: 'Account banned' });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.AccountId,
          username: user.Name,
          email: user.Email || '',
          coins: user.coins || 0,
          authority: user.Authority || 0
        }
      }
    });
  } catch (err) {
    console.error('Session error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // In a production system with token blacklisting, you'd invalidate the token here
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
