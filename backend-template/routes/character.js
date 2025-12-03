const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// POST /api/character/unbug
router.post('/unbug', authMiddleware, async (req, res) => {
  try {
    const { characterId } = req.body;
    const pool = await poolPromise;

    // Verify character belongs to user
    const charResult = await pool.request()
      .input('charId', sql.Int, characterId)
      .input('accountId', sql.Int, req.user.id)
      .query('SELECT * FROM character WHERE CharacterId = @charId AND AccountId = @accountId');

    if (charResult.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Character not found' });
    }

    // Reset character position to safe location (NosVille)
    await pool.request()
      .input('charId', sql.Int, characterId)
      .query(`
        UPDATE character 
        SET MapId = 1, MapX = 79, MapY = 116 
        WHERE CharacterId = @charId
      `);

    res.json({ success: true, message: 'Character has been moved to a safe location' });
  } catch (err) {
    console.error('Unbug error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/character/list
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('accountId', sql.Int, req.user.id)
      .query(`
        SELECT CharacterId, Name, Class, Level, JobLevel, HeroLevel
        FROM character 
        WHERE AccountId = @accountId
        ORDER BY Level DESC
      `);

    const characters = result.recordset.map(char => ({
      id: char.CharacterId,
      name: char.Name,
      class: getClassName(char.Class),
      level: char.Level,
      jobLevel: char.JobLevel,
      heroLevel: char.HeroLevel || 0
    }));

    res.json({ success: true, data: characters });
  } catch (err) {
    console.error('Character list error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/character/:name
router.get('/:name', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('name', sql.VarChar, req.params.name)
      .query(`
        SELECT c.CharacterId, c.Name, c.Class, c.Level, c.JobLevel, c.HeroLevel,
               c.Reputation, c.Compliment, c.Act4Kill, c.Act4Dead
        FROM character c
        INNER JOIN account a ON c.AccountId = a.AccountId
        WHERE c.Name = @name AND a.Authority < 2
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Character not found' });
    }

    const char = result.recordset[0];
    res.json({
      success: true,
      data: {
        name: char.Name,
        class: getClassName(char.Class),
        level: char.Level,
        jobLevel: char.JobLevel,
        heroLevel: char.HeroLevel || 0,
        reputation: char.Reputation,
        compliment: char.Compliment,
        kills: char.Act4Kill || 0,
        deaths: char.Act4Dead || 0
      }
    });
  } catch (err) {
    console.error('Character info error:', err);
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
