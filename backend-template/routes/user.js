const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// GET /api/user/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.BigInt, req.user.id)
      .query(`
        SELECT AccountId, Name, Email, Authority, Coins, RegistrationIP
        FROM Account WHERE AccountId = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const user = result.recordset[0];
    res.json({
      success: true,
      data: {
        id: user.AccountId,
        username: user.Name,
        email: user.Email,
        coins: user.Coins || 0,
        authority: user.Authority || 0
      }
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/user/coins
router.get('/coins', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.BigInt, req.user.id)
      .query('SELECT Coins FROM Account WHERE AccountId = @id');

    res.json({ success: true, data: { coins: result.recordset[0]?.Coins || 0 } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/user/password
router.post('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const crypto = require('crypto');
    
    // SECURITY: Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Both passwords are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
    }
    
    if (newPassword.length > 100) {
      return res.status(400).json({ success: false, error: 'Password too long' });
    }
    
    // SHA512 hash function
    function sha512(password) {
      return crypto.createHash('sha512').update(password, 'utf8').digest('hex');
    }
    
    const pool = await poolPromise;

    const result = await pool.request()
      .input('id', sql.BigInt, req.user.id)
      .query('SELECT Password FROM Account WHERE AccountId = @id');

    const user = result.recordset[0];
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const hashedCurrentPassword = sha512(currentPassword);
    
    // SECURITY: Use timing-safe comparison
    const passwordMatch = crypto.timingSafeEqual(
      Buffer.from(user.Password.toLowerCase()),
      Buffer.from(hashedCurrentPassword.toLowerCase())
    );
    
    if (!passwordMatch) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    const hashedNewPassword = sha512(newPassword);
    
    await pool.request()
      .input('id', sql.BigInt, req.user.id)
      .input('password', sql.VarChar, hashedNewPassword)
      .query('UPDATE Account SET Password = @password WHERE AccountId = @id');

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/user/characters
router.get('/characters', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.BigInt, req.user.id)
      .query(`
        SELECT CharacterId, Name, Class, Level, JobLevel, HeroLevel, 
               Reputation, Gold, Compliment, Act4Dead, Act4Kill
        FROM Character 
        WHERE AccountId = @id
        ORDER BY Level DESC
      `);

    const characters = result.recordset.map(char => ({
      id: char.CharacterId,
      name: char.Name,
      class: getClassName(char.Class),
      level: char.Level,
      jobLevel: char.JobLevel,
      heroLevel: char.HeroLevel || 0,
      reputation: char.Reputation,
      gold: char.Gold
    }));

    res.json({ success: true, data: characters });
  } catch (err) {
    console.error('Characters error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

function getClassName(classId) {
  const classes = {
    0: 'Adventurer',
    1: 'Swordsman',
    2: 'Archer',
    3: 'Mage',
    4: 'Martial Artist'
  };
  return classes[classId] || 'Unknown';
}

module.exports = router;
