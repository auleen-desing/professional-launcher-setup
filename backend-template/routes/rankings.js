const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');

// GET /api/rankings/level
router.get('/level', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT TOP 100 
          c.CharacterId, c.Name, c.Class, c.Level, c.JobLevel, c.HeroLevel,
          c.Reputation, a.Name as AccountName
        FROM character c
        INNER JOIN account a ON c.AccountId = a.AccountId
        WHERE a.Authority < 2
        ORDER BY c.Level DESC, c.JobLevel DESC, c.HeroLevel DESC
      `);

    const rankings = result.recordset.map((char, index) => ({
      rank: index + 1,
      name: char.Name,
      class: getClassName(char.Class),
      level: char.Level,
      jobLevel: char.JobLevel,
      heroLevel: char.HeroLevel || 0
    }));

    res.json({ success: true, data: rankings });
  } catch (err) {
    console.error('Rankings error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/rankings/reputation
router.get('/reputation', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT TOP 100 
          c.Name, c.Class, c.Level, c.Reputation
        FROM character c
        INNER JOIN account a ON c.AccountId = a.AccountId
        WHERE a.Authority < 2
        ORDER BY c.Reputation DESC
      `);

    const rankings = result.recordset.map((char, index) => ({
      rank: index + 1,
      name: char.Name,
      class: getClassName(char.Class),
      level: char.Level,
      reputation: char.Reputation
    }));

    res.json({ success: true, data: rankings });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/rankings/pvp
router.get('/pvp', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT TOP 100 
          c.Name, c.Class, c.Level, c.Act4Kill, c.Act4Dead
        FROM character c
        INNER JOIN account a ON c.AccountId = a.AccountId
        WHERE a.Authority < 2
        ORDER BY c.Act4Kill DESC
      `);

    const rankings = result.recordset.map((char, index) => ({
      rank: index + 1,
      name: char.Name,
      class: getClassName(char.Class),
      level: char.Level,
      kills: char.Act4Kill || 0,
      deaths: char.Act4Dead || 0
    }));

    res.json({ success: true, data: rankings });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

function getClassName(classId) {
  const classes = { 0: 'Adventurer', 1: 'Swordsman', 2: 'Archer', 3: 'Mage', 4: 'Martial Artist' };
  return classes[classId] || 'Unknown';
}

module.exports = router;
