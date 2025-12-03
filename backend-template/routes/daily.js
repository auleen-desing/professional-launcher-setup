const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const DAILY_REWARDS = [
  { day: 1, coins: 100 },
  { day: 2, coins: 150 },
  { day: 3, coins: 200 },
  { day: 4, coins: 300 },
  { day: 5, coins: 400 },
  { day: 6, coins: 500 },
  { day: 7, coins: 1000 }
];

// GET /api/daily/status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('accountId', sql.Int, req.user.id)
      .query(`
        SELECT LastClaim, Streak FROM web_daily_rewards WHERE AccountId = @accountId
      `);

    const data = result.recordset[0];
    const today = new Date().toDateString();
    const lastClaim = data?.LastClaim ? new Date(data.LastClaim).toDateString() : null;
    const canClaim = lastClaim !== today;
    const streak = data?.Streak || 0;

    res.json({
      success: true,
      data: {
        canClaim,
        streak,
        currentDay: (streak % 7) + 1,
        rewards: DAILY_REWARDS
      }
    });
  } catch (err) {
    res.json({ success: true, data: { canClaim: true, streak: 0, currentDay: 1, rewards: DAILY_REWARDS } });
  }
});

// POST /api/daily/claim
router.post('/claim', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Check if already claimed today
    const statusResult = await pool.request()
      .input('accountId', sql.Int, req.user.id)
      .query('SELECT LastClaim, Streak FROM web_daily_rewards WHERE AccountId = @accountId');

    const data = statusResult.recordset[0];
    const today = new Date();
    const lastClaim = data?.LastClaim ? new Date(data.LastClaim) : null;

    if (lastClaim && lastClaim.toDateString() === today.toDateString()) {
      return res.status(400).json({ success: false, error: 'Already claimed today' });
    }

    // Calculate streak
    let streak = 1;
    if (lastClaim) {
      const dayDiff = Math.floor((today - lastClaim) / (1000 * 60 * 60 * 24));
      streak = dayDiff === 1 ? (data.Streak % 7) + 1 : 1;
    }

    const reward = DAILY_REWARDS[streak - 1].coins;

    // Update or insert daily record
    await pool.request()
      .input('accountId', sql.Int, req.user.id)
      .input('streak', sql.Int, streak)
      .query(`
        MERGE web_daily_rewards AS target
        USING (SELECT @accountId AS AccountId) AS source
        ON target.AccountId = source.AccountId
        WHEN MATCHED THEN UPDATE SET LastClaim = GETDATE(), Streak = @streak
        WHEN NOT MATCHED THEN INSERT (AccountId, LastClaim, Streak) VALUES (@accountId, GETDATE(), @streak);
      `);

    // Add coins
    await pool.request()
      .input('accountId', sql.Int, req.user.id)
      .input('coins', sql.Int, reward)
      .query('UPDATE account SET Coins = Coins + @coins WHERE AccountId = @accountId');

    res.json({ success: true, data: { reward, newStreak: streak } });
  } catch (err) {
    console.error('Daily claim error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
