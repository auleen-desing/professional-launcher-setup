const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// GET /api/user/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.user.id)
      .query(`
        SELECT AccountId, Name, Email, Authority, Coins, RegistrationIP
        FROM account WHERE AccountId = @id
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
        isAdmin: user.Authority >= 2
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
      .input('id', sql.Int, req.user.id)
      .query('SELECT Coins FROM account WHERE AccountId = @id');

    res.json({ success: true, data: { coins: result.recordset[0]?.Coins || 0 } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/user/password
router.post('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('id', sql.Int, req.user.id)
      .query('SELECT Password FROM account WHERE AccountId = @id');

    const user = result.recordset[0];
    if (user.Password !== currentPassword) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    await pool.request()
      .input('id', sql.Int, req.user.id)
      .input('password', sql.VarChar, newPassword)
      .query('UPDATE account SET Password = @password WHERE AccountId = @id');

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
      .input('id', sql.Int, req.user.id)
      .query(`
        SELECT CharacterId, Name, Class, Level, JobLevel, HeroLevel, 
               Reputation, Gold, Compliment, Act4Dead, Act4Kill
        FROM character 
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
