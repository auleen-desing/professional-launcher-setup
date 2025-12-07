const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// GET /api/daily/status - Get daily reward status and prizes from database
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Get prizes from web_daily_prizes table
    const prizesResult = await pool.request()
      .query(`
        SELECT Day, Coins, ItemVNum, ItemAmount, Special 
        FROM web_daily_prizes 
        ORDER BY Day ASC
      `);
    
    const prizes = prizesResult.recordset.map(p => ({
      day: p.Day,
      coins: p.Coins || 0,
      itemVNum: p.ItemVNum,
      itemAmount: p.ItemAmount || 0,
      special: p.Special === 1 || p.Special === true
    }));

    // Get user's daily reward status
    const statusResult = await pool.request()
      .input('accountId', sql.BigInt, req.user.id)
      .query(`
        SELECT LastClaim, Streak FROM web_daily_rewards WHERE AccountId = @accountId
      `);

    const data = statusResult.recordset[0];
    const today = new Date();
    const todayStr = today.toDateString();
    const lastClaim = data?.LastClaim ? new Date(data.LastClaim) : null;
    const lastClaimStr = lastClaim ? lastClaim.toDateString() : null;
    
    // Check if can claim today
    const canClaim = lastClaimStr !== todayStr;
    
    // Calculate current streak and day
    let streak = data?.Streak || 0;
    let currentDay = 1;
    
    if (lastClaim) {
      const dayDiff = Math.floor((today - lastClaim) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 0) {
        // Claimed today, show next day
        currentDay = (streak % prizes.length) + 1;
      } else if (dayDiff === 1) {
        // Yesterday claim, continue streak
        currentDay = (streak % prizes.length) + 1;
      } else {
        // Streak broken, reset to day 1
        currentDay = 1;
        streak = 0;
      }
    }

    // Mark which days are claimed and current
    const rewardsWithStatus = prizes.map((prize, index) => ({
      ...prize,
      claimed: index < (streak % prizes.length) || (index < streak && !canClaim),
      current: index + 1 === currentDay && canClaim
    }));

    console.log(`[Daily] User ${req.user.id} - Streak: ${streak}, CurrentDay: ${currentDay}, CanClaim: ${canClaim}`);

    res.json({
      success: true,
      data: {
        canClaim,
        streak,
        currentDay,
        rewards: rewardsWithStatus,
        nextReward: canClaim ? prizes[currentDay - 1] : null
      }
    });
  } catch (err) {
    console.error('[Daily] Status error:', err);
    res.status(500).json({ success: false, error: 'Error fetching daily status' });
  }
});

// POST /api/daily/claim - Claim daily reward
router.post('/claim', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Get prizes from database
    const prizesResult = await pool.request()
      .query(`
        SELECT Day, Coins, ItemVNum, ItemAmount, Special 
        FROM web_daily_prizes 
        ORDER BY Day ASC
      `);
    
    const prizes = prizesResult.recordset;
    const maxDays = prizes.length;

// Check if already claimed today using SQL Server date comparison
    const checkResult = await pool.request()
      .input('accountId', sql.BigInt, req.user.id)
      .query(`
        SELECT LastClaim, Streak,
          CASE WHEN CAST(LastClaim AS DATE) = CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END AS ClaimedToday,
          DATEDIFF(DAY, LastClaim, GETDATE()) AS DaysSinceLastClaim
        FROM web_daily_rewards 
        WHERE AccountId = @accountId
      `);

    const data = checkResult.recordset[0];

    if (data && data.ClaimedToday === 1) {
      return res.status(400).json({ success: false, error: 'You already claimed your reward today' });
    }
    
    const daysSinceLastClaim = data?.DaysSinceLastClaim ?? null;

    // Calculate new streak based on days since last claim
    let newStreak = 1;
    if (data && daysSinceLastClaim !== null) {
      if (daysSinceLastClaim === 1) {
        // Continue streak (yesterday claim)
        newStreak = ((data.Streak || 0) % maxDays) + 1;
      } else {
        // Streak broken (more than 1 day), reset
        newStreak = 1;
      }
    }

    // Get reward for current day
    const currentPrize = prizes[newStreak - 1];
    const coinsReward = currentPrize?.Coins || 0;
    const itemVNum = currentPrize?.ItemVNum;
    const itemAmount = currentPrize?.ItemAmount || 0;

    // Update or insert daily record
    await pool.request()
      .input('accountId', sql.BigInt, req.user.id)
      .input('streak', sql.Int, newStreak)
      .query(`
        MERGE web_daily_rewards AS target
        USING (SELECT @accountId AS AccountId) AS source
        ON target.AccountId = source.AccountId
        WHEN MATCHED THEN UPDATE SET LastClaim = GETDATE(), Streak = @streak
        WHEN NOT MATCHED THEN INSERT (AccountId, LastClaim, Streak) VALUES (@accountId, GETDATE(), @streak);
      `);

    // Add coins to account
    if (coinsReward > 0) {
      await pool.request()
        .input('accountId', sql.BigInt, req.user.id)
        .input('coins', sql.Int, coinsReward)
        .query('UPDATE Account SET coins = coins + @coins WHERE AccountId = @accountId');
    }

    // If there's an item reward, log it
    if (itemVNum && itemAmount > 0) {
      console.log(`[Daily] Item reward: VNum ${itemVNum} x${itemAmount} for user ${req.user.id}`);
    }

    // Get updated coin balance
    const balanceResult = await pool.request()
      .input('accountId', sql.BigInt, req.user.id)
      .query('SELECT coins FROM Account WHERE AccountId = @accountId');
    
    const newBalance = balanceResult.recordset[0]?.coins || 0;

    console.log(`[Daily] User ${req.user.id} claimed day ${newStreak}: ${coinsReward} coins`);

    res.json({ 
      success: true, 
      data: { 
        day: newStreak,
        coinsReward,
        itemVNum,
        itemAmount,
        newStreak,
        newBalance
      } 
    });
  } catch (err) {
    console.error('[Daily] Claim error:', err);
    res.status(500).json({ success: false, error: 'Error al reclamar recompensa' });
  }
});

module.exports = router;
