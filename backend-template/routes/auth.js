const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { sql, poolPromise } = require('../config/database');
const { generateToken, authMiddleware } = require('../middleware/auth');

// SHA512 hash function (NosTale standard)
function sha512(password) {
  return crypto.createHash('sha512').update(password, 'utf8').digest('hex');
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query(`
        SELECT AccountId, Name, Password, Authority, Email, coins
        FROM Account 
        WHERE Name = @username
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = result.recordset[0];

    // Compare SHA512 hashed password
    const hashedPassword = sha512(password);
    const isValidPassword = hashedPassword.toLowerCase() === user.Password.toLowerCase();

    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateToken(user);

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
    res.status(500).json({ success: false, error: 'Server error', details: err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ success: false, error: 'Username must be 3-20 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const pool = await poolPromise;
    
    // Check if user exists
    const existing = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT AccountId FROM Account WHERE Name = @username');

    if (existing.recordset.length > 0) {
      return res.status(400).json({ success: false, error: 'Username already exists' });
    }

    // Hash password with SHA512
    const hashedPassword = sha512(password);

    // Insert new user - matching your exact schema
    await pool.request()
      .input('username', sql.NVarChar, username)
      .input('password', sql.VarChar, hashedPassword)
      .input('email', sql.NVarChar, email)
      .query(`
        INSERT INTO Account (Name, Password, Email, Authority, ReferrerId, IsConnected, coins, DailyRewardSent, CanUseCP)
        VALUES (@username, @password, @email, 0, 0, 0, 0, 0, 0)
      `);

    res.json({ success: true, message: 'Account created successfully' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Server error', 
      details: err.message 
    });
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
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
