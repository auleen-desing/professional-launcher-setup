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
        SELECT AccountId, Name, Password, Authority, Email, RegistrationIP, Coins
        FROM account 
        WHERE Name = @username
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = result.recordset[0];

    // Compare password (adjust based on your hash method)
    // NosTale typically uses SHA512 or plain text
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
          email: user.Email,
          coins: user.Coins || 0,
          authority: user.Authority || 0
        }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    const pool = await poolPromise;
    
    // Check if user exists
    const existing = await pool.request()
      .input('username', sql.VarChar, username)
      .input('email', sql.VarChar, email)
      .query('SELECT AccountId FROM account WHERE Name = @username OR Email = @email');

    if (existing.recordset.length > 0) {
      return res.status(400).json({ success: false, error: 'Username or email already exists' });
    }

    // Insert new user
    const clientIP = req.ip || req.connection.remoteAddress;
    await pool.request()
      .input('username', sql.VarChar, username)
      .input('password', sql.VarChar, password) // Hash if needed
      .input('email', sql.VarChar, email)
      .input('ip', sql.VarChar, clientIP)
      .query(`
        INSERT INTO account (Name, Password, Email, Authority, RegistrationIP, Coins)
        VALUES (@username, @password, @email, 0, @ip, 0)
      `);

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
          email: user.Email,
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
