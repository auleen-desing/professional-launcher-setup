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
      .input('charId', sql.BigInt, characterId)
      .input('accountId', sql.BigInt, req.user.id)
      .query('SELECT * FROM Character WHERE CharacterId = @charId AND AccountId = @accountId');

    if (charResult.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Character not found' });
    }

    // Reset character position to safe location (NosVille)
    await pool.request()
      .input('charId', sql.BigInt, characterId)
      .query(`
        UPDATE Character 
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
      .input('accountId', sql.BigInt, req.user.id)
      .query(`
        SELECT CharacterId, Name, Class, Level, JobLevel, HeroLevel, Gender,
               Gold, GoldBank, Reputation, Compliment, Dignity, Faction,
               Act4Kill, Act4Dead, Act4Points, Act4MonthlyPoints,
               ArenaKill, ArenaDeath, ArenaWinner, RBBWin, RBBLose,
               TalentWin, TalentLose, TalentSurrender,
               HeroXp, LevelXp, JobLevelXp, SpPoint, SpAdditionPoint,
               MasterPoints, MasterTicket, Prestige, Legacy,
               CompletedTimeSpaces, BattlePassPoints, HavePremiumBattlePass,
               IsConnected
        FROM Character 
        WHERE AccountId = @accountId
        ORDER BY Level DESC
      `);

    const characters = result.recordset.map(char => ({
      id: char.CharacterId,
      name: char.Name,
      class: getClassName(char.Class),
      level: char.Level,
      jobLevel: char.JobLevel,
      heroLevel: char.HeroLevel || 0,
      gender: char.Gender === 0 ? 'Male' : 'Female',
      gold: char.Gold || 0,
      goldBank: char.GoldBank || 0,
      reputation: char.Reputation || 0,
      compliment: char.Compliment || 0,
      dignity: char.Dignity || 0,
      faction: getFactionName(char.Faction),
      act4Kills: char.Act4Kill || 0,
      act4Deaths: char.Act4Dead || 0,
      act4Points: char.Act4Points || 0,
      act4MonthlyPoints: char.Act4MonthlyPoints || 0,
      arenaKills: char.ArenaKill || 0,
      arenaDeaths: char.ArenaDeath || 0,
      arenaWinner: char.ArenaWinner || 0,
      rbbWins: char.RBBWin || 0,
      rbbLosses: char.RBBLose || 0,
      talentWins: char.TalentWin || 0,
      talentLosses: char.TalentLose || 0,
      talentSurrenders: char.TalentSurrender || 0,
      heroXp: char.HeroXp || 0,
      levelXp: char.LevelXp || 0,
      jobLevelXp: char.JobLevelXp || 0,
      spPoint: char.SpPoint || 0,
      spAdditionPoint: char.SpAdditionPoint || 0,
      masterPoints: char.MasterPoints || 0,
      masterTicket: char.MasterTicket || 0,
      prestige: char.Prestige || 0,
      legacy: char.Legacy || 0,
      completedTimeSpaces: char.CompletedTimeSpaces || 0,
      battlePassPoints: char.BattlePassPoints || 0,
      hasPremiumBattlePass: char.HavePremiumBattlePass || false,
      isOnline: char.IsConnected || false
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
        FROM Character c
        INNER JOIN Account a ON c.AccountId = a.AccountId
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

function getFactionName(factionId) {
  const factions = {
    0: 'None',
    1: 'Angel',
    2: 'Demon'
  };
  return factions[factionId] || 'None';
}

module.exports = router;
