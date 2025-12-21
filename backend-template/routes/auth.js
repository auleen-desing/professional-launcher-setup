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

// Resend for email verification
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// Frontend URL for verification links
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://novaerasite.com';

// SHA512 hash function (NosTale standard)
function sha512(password) {
  return crypto.createHash('sha512').update(password, 'utf8').digest('hex');
}

// Generate secure random token
function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
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

// Send verification email
async function sendVerificationEmail(email, username, token) {
  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'NovaEra <noreply@novaerasite.com>',
      to: [email],
      subject: 'Verify your NovaEra account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0f0f0f; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #d4af37;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #d4af37; font-size: 32px; margin: 0;">NovaEra</h1>
                <p style="color: #888; margin-top: 8px;">Account Verification</p>
              </div>
              
              <p style="color: #ffffff; font-size: 16px; line-height: 1.6;">
                Hello <strong style="color: #d4af37;">${username}</strong>,
              </p>
              
              <p style="color: #cccccc; font-size: 15px; line-height: 1.6;">
                Thank you for registering at NovaEra! Please verify your email address to activate your account.
              </p>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); color: #000000; font-weight: bold; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px;">
                  Verify My Account
                </a>
              </div>
              
              <p style="color: #888888; font-size: 13px; line-height: 1.5;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #d4af37; word-break: break-all;">${verificationUrl}</a>
              </p>
              
              <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">
              
              <p style="color: #666666; font-size: 12px; text-align: center;">
                This link will expire in 24 hours.<br>
                If you didn't create an account, you can safely ignore this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('[EMAIL] Failed to send verification email:', error);
      return false;
    }

    console.log('[EMAIL] Verification email sent to:', email);
    return true;
  } catch (err) {
    console.error('[EMAIL] Error sending verification email:', err);
    return false;
  }
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

    const result = await pool.request()
      .input('username', sql.NVarChar, username.substring(0, 20)) // Limit length
      .query(`
        SELECT AccountId, Name, Password, Authority, Email, Coins, WebCoins
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

    // Check if email is verified (check web_email_verifications table)
    const verificationCheck = await pool.request()
      .input('accountId', sql.BigInt, user.AccountId)
      .query('SELECT VerifiedAt FROM web_email_verifications WHERE AccountId = @accountId');
    
    const isVerified = verificationCheck.recordset.length > 0 && verificationCheck.recordset[0].VerifiedAt != null;
    
    if (!isVerified) {
      return res.status(403).json({ 
        success: false, 
        error: 'Please verify your email before logging in. Check your inbox for the verification link.',
        needsVerification: true,
        email: user.Email
      });
    }

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
    
    console.log(`[AUTH DEBUG] User ${username} - Authority: ${user.Authority}, isAdmin: ${user.Authority >= 300}`);
    
    const token = generateToken(user);

    console.log(`[AUTH] Successful login: ${username} from ${ip}`);

    const gameCoins = user.Coins || 0;
    const webCoins = user.WebCoins || 0;

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.AccountId,
          username: user.Name,
          email: user.Email || '',
          coins: webCoins,              // spendable balance for the website
          gameCoins: gameCoins,         // read-only (managed by the game)
          totalCoins: gameCoins + webCoins,
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

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Insert new user - matching exact table structure
    const insertResult = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('password', sql.VarChar, hashedPassword)
      .input('email', sql.NVarChar, email.toLowerCase())
      .input('registrationIP', sql.NVarChar, registrationIP)
      .query(`
        INSERT INTO Account (Name, Password, Email, Authority, ReferrerId, RegistrationIP, IsConnected, coins)
        OUTPUT INSERTED.AccountId
        VALUES (@username, @password, @email, 0, 0, @registrationIP, 0, 0)
      `);

    const accountId = insertResult.recordset[0].AccountId;

    // Create verification token entry
    await pool.request()
      .input('accountId', sql.BigInt, accountId)
      .input('token', sql.NVarChar, verificationToken)
      .input('email', sql.NVarChar, email.toLowerCase())
      .input('expiresAt', sql.DateTime, expiresAt)
      .query(`
        INSERT INTO web_email_verifications (AccountId, Token, Email, ExpiresAt)
        VALUES (@accountId, @token, @email, @expiresAt)
      `);

    // Send verification email
    const emailSent = await sendVerificationEmail(email, username, verificationToken);

    if (!emailSent) {
      console.error(`[AUTH] Failed to send verification email for ${username}`);
      // Still return success - user can request resend
    }

    console.log(`[AUTH] New registration (pending verification): ${username} from ${ip}`);

    res.json({ 
      success: true, 
      message: 'Account created! Please check your email to verify your account.',
      needsVerification: true
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/auth/verify-email - Verify email with token
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, error: 'Verification token required' });
    }

    const pool = await poolPromise;
    
    // Find the verification token
    const result = await pool.request()
      .input('token', sql.NVarChar, token)
      .query(`
        SELECT v.*, a.Name as Username
        FROM web_email_verifications v
        JOIN Account a ON v.AccountId = a.AccountId
        WHERE v.Token = @token
      `);

    if (result.recordset.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid verification token' });
    }

    const verification = result.recordset[0];

    // Check if already verified
    if (verification.VerifiedAt) {
      return res.status(400).json({ success: false, error: 'Email already verified. You can login now.' });
    }

    // Check if token expired
    if (new Date(verification.ExpiresAt) < new Date()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Verification link has expired. Please request a new one.',
        expired: true 
      });
    }

    // Mark token as used
    await pool.request()
      .input('token', sql.NVarChar, token)
      .query('UPDATE web_email_verifications SET VerifiedAt = GETDATE() WHERE Token = @token');

    // Email verified - Authority remains at 0
    console.log(`[AUTH] Email verified for user: ${verification.Username}`);

    res.json({ 
      success: true, 
      message: 'Email verified successfully! You can now login.',
      username: verification.Username
    });
  } catch (err) {
    console.error('Email verification error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/auth/resend-verification - Resend verification email
router.post('/resend-verification', authRateLimit, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'Email required' });
    }

    const pool = await poolPromise;
    
    // Find the account
    const result = await pool.request()
      .input('email', sql.NVarChar, email.toLowerCase())
      .query('SELECT AccountId, Name, Email FROM Account WHERE LOWER(Email) = @email');

    if (result.recordset.length === 0) {
      // Don't reveal if email exists or not
      return res.json({ success: true, message: 'If an account exists with this email, a verification link has been sent.' });
    }

    const user = result.recordset[0];

    // Check if already verified (from web_email_verifications table)
    const verifyCheck = await pool.request()
      .input('accountId', sql.BigInt, user.AccountId)
      .query('SELECT VerifiedAt FROM web_email_verifications WHERE AccountId = @accountId AND VerifiedAt IS NOT NULL');
    
    if (verifyCheck.recordset.length > 0) {
      return res.status(400).json({ success: false, error: 'Email is already verified. You can login now.' });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete old tokens and create new one
    await pool.request()
      .input('accountId', sql.BigInt, user.AccountId)
      .query('DELETE FROM web_email_verifications WHERE AccountId = @accountId AND VerifiedAt IS NULL');

    await pool.request()
      .input('accountId', sql.BigInt, user.AccountId)
      .input('token', sql.NVarChar, verificationToken)
      .input('email', sql.NVarChar, user.Email)
      .input('expiresAt', sql.DateTime, expiresAt)
      .query(`
        INSERT INTO web_email_verifications (AccountId, Token, Email, ExpiresAt)
        VALUES (@accountId, @token, @email, @expiresAt)
      `);

    // Send verification email
    await sendVerificationEmail(user.Email, user.Name, verificationToken);

    console.log(`[AUTH] Resent verification email to: ${email}`);

    res.json({ success: true, message: 'Verification email sent. Please check your inbox.' });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Send password reset email
async function sendPasswordResetEmail(email, username, token) {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'NovaEra <noreply@novaerasite.com>',
      to: [email],
      subject: 'Reset your NovaEra password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0f0f0f; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #d4af37;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #d4af37; font-size: 32px; margin: 0;">NovaEra</h1>
                <p style="color: #888; margin-top: 8px;">Password Reset</p>
              </div>
              
              <p style="color: #ffffff; font-size: 16px; line-height: 1.6;">
                Hello <strong style="color: #d4af37;">${username}</strong>,
              </p>
              
              <p style="color: #cccccc; font-size: 15px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to create a new password.
              </p>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); color: #000000; font-weight: bold; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #888888; font-size: 13px; line-height: 1.5;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #d4af37; word-break: break-all;">${resetUrl}</a>
              </p>
              
              <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">
              
              <p style="color: #666666; font-size: 12px; text-align: center;">
                This link will expire in 1 hour.<br>
                If you didn't request a password reset, you can safely ignore this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('[EMAIL] Failed to send password reset email:', error);
      return false;
    }

    console.log('[EMAIL] Password reset email sent to:', email);
    return true;
  } catch (err) {
    console.error('[EMAIL] Error sending password reset email:', err);
    return false;
  }
}

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', authRateLimit, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'Email required' });
    }

    const pool = await poolPromise;
    
    // Find the account
    const result = await pool.request()
      .input('email', sql.NVarChar, email.toLowerCase())
      .query('SELECT AccountId, Name, Email FROM Account WHERE LOWER(Email) = @email');

    if (result.recordset.length === 0) {
      // Don't reveal if email exists or not
      return res.json({ success: true, message: 'If an account exists with this email, a reset link has been sent.' });
    }

    const user = result.recordset[0];

    // Generate reset token
    const resetToken = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete old tokens and create new one
    await pool.request()
      .input('accountId', sql.BigInt, user.AccountId)
      .query('DELETE FROM web_password_resets WHERE AccountId = @accountId AND UsedAt IS NULL');

    await pool.request()
      .input('accountId', sql.BigInt, user.AccountId)
      .input('token', sql.NVarChar, resetToken)
      .input('email', sql.NVarChar, user.Email)
      .input('expiresAt', sql.DateTime, expiresAt)
      .query(`
        INSERT INTO web_password_resets (AccountId, Token, Email, ExpiresAt)
        VALUES (@accountId, @token, @email, @expiresAt)
      `);

    // Send password reset email
    const emailSent = await sendPasswordResetEmail(user.Email, user.Name, resetToken);

    if (!emailSent) {
      console.log(`[AUTH] Failed to send password reset email for ${email}`);
    } else {
      console.log(`[AUTH] Password reset requested for: ${email}`);
    }

    res.json({ success: true, message: 'If an account exists with this email, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', authRateLimit, async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, error: 'Token required' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const pool = await poolPromise;
    
    // Find the reset token
    const result = await pool.request()
      .input('token', sql.NVarChar, token)
      .query(`
        SELECT AccountId, Email, ExpiresAt, UsedAt 
        FROM web_password_resets 
        WHERE Token = @token
      `);

    if (result.recordset.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset link' });
    }

    const resetRequest = result.recordset[0];

    // Check if already used
    if (resetRequest.UsedAt) {
      return res.status(400).json({ success: false, error: 'This reset link has already been used' });
    }

    // Check if expired
    if (new Date() > new Date(resetRequest.ExpiresAt)) {
      return res.status(400).json({ success: false, error: 'Reset link has expired. Please request a new one.' });
    }

    // Hash new password
    const hashedPassword = sha512(password);

    // Update password
    await pool.request()
      .input('accountId', sql.BigInt, resetRequest.AccountId)
      .input('password', sql.VarChar, hashedPassword)
      .query('UPDATE Account SET Password = @password WHERE AccountId = @accountId');

    // Mark token as used
    await pool.request()
      .input('token', sql.NVarChar, token)
      .input('usedAt', sql.DateTime, new Date())
      .query('UPDATE web_password_resets SET UsedAt = @usedAt WHERE Token = @token');

    console.log(`[AUTH] Password reset completed for account ${resetRequest.AccountId}`);

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/auth/session
router.get('/session', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.BigInt, req.user.id)
      .query('SELECT AccountId, Name, Email, Authority, Coins, WebCoins FROM Account WHERE AccountId = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const user = result.recordset[0];

    // Check if banned
    if (user.Authority === -1) {
      return res.status(403).json({ success: false, error: 'Account banned' });
    }

    const gameCoins = user.Coins || 0;
    const webCoins = user.WebCoins || 0;

    res.json({
      success: true,
      data: {
        user: {
          id: user.AccountId,
          username: user.Name,
          email: user.Email || '',
          coins: webCoins,              // spendable balance for the website
          gameCoins: gameCoins,         // read-only (managed by the game)
          totalCoins: gameCoins + webCoins,
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
