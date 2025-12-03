const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { sql, poolPromise } = require('../config/database');
const { generateToken, authMiddleware } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .query(`
        SELECT AccountId, Name, Password, Authority, Email, Coins
        FROM account 
        WHERE Name = @username
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = result.recordset[0];

    // Compare password (NosTale typically uses plain text or SHA512)
    const isValidPassword = password === user.Password || 
      await bcrypt.compare(password, user.Password);

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
          coins: user.Coins || 0,
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

    // Validate input
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ success: false, error: 'Username must be 3-20 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const pool = await poolPromise;
    
    // Check if user exists
    const existing = await pool.request()
      .input('username', sql.VarChar, username)
      .query('SELECT AccountId FROM account WHERE Name = @username');

    if (existing.recordset.length > 0) {
      return res.status(400).json({ success: false, error: 'Username already exists' });
    }

    // Insert new user - Adjusted for standard NosTale account table
    // Most NosTale tables have: AccountId (identity), Name, Password, Authority
    // Email and Coins columns may need to be added manually
    await pool.request()
      .input('username', sql.VarChar, username)
      .input('password', sql.VarChar, password)
      .input('email', sql.VarChar, email)
      .query(`
        INSERT INTO account (Name, Password, Authority, Email)
        VALUES (@username, @password, 0, @email)
      `);

    res.json({ success: true, message: 'Account created successfully' });
  } catch (err) {
    console.error('Register error:', err);
    // Return detailed error for debugging
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
      .input('id', sql.Int, req.user.id)
      .query('SELECT AccountId, Name, Email, Authority, Coins FROM account WHERE AccountId = @id');

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
          coins: user.Coins || 0,
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
