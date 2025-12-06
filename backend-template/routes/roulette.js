const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const SPIN_COST = 2500;

// GET /api/roulette/prizes - Get prizes from database
router.get('/prizes', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT Id as id, Name as name, Type as type, Value as value, Chance as chance
        FROM web_roulette_prizes
        ORDER BY Chance DESC
      `);

    const prizes = result.recordset.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      value: p.value,
      chance: parseFloat(p.chance)
    }));

    res.json({ success: true, data: { prizes, spinCost: SPIN_COST } });
  } catch (err) {
    console.error('Roulette prizes error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/roulette/spin
router.post('/spin', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;

    // Check coins
    const userResult = await pool.request()
      .input('id', sql.Int, req.user.id)
      .query('SELECT Coins FROM account WHERE AccountId = @id');

    const coins = userResult.recordset[0]?.Coins || 0;
    if (coins < SPIN_COST) {
      return res.status(400).json({ success: false, error: 'Insufficient coins' });
    }

    // Get prizes from database
    const prizesResult = await pool.request()
      .query(`
        SELECT Id as id, Name as name, Type as type, Value as value, Chance as chance
        FROM web_roulette_prizes
        ORDER BY Chance DESC
      `);

    const prizes = prizesResult.recordset.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      value: p.value,
      chance: parseFloat(p.chance)
    }));

    // Deduct spin cost
    await pool.request()
      .input('id', sql.Int, req.user.id)
      .input('cost', sql.Int, SPIN_COST)
      .query('UPDATE account SET Coins = Coins - @cost WHERE AccountId = @id');

    // Determine prize (weighted random)
    const random = Math.random() * 100;
    let cumulative = 0;
    let prize = prizes[prizes.length - 1];
    
    for (const p of prizes) {
      cumulative += p.chance;
      if (random <= cumulative) {
        prize = p;
        break;
      }
    }

    // Award prize
    if (prize.type === 'coins') {
      await pool.request()
        .input('id', sql.Int, req.user.id)
        .input('coins', sql.Int, prize.value)
        .query('UPDATE account SET Coins = Coins + @coins WHERE AccountId = @id');
    } else if (prize.type === 'item') {
      // Log item prize for manual delivery or game integration
      console.log(`[Roulette] User ${req.user.id} won item ${prize.value} (${prize.name})`);
    }

    // Get new balance
    const newBalance = await pool.request()
      .input('id', sql.Int, req.user.id)
      .query('SELECT Coins FROM account WHERE AccountId = @id');

    res.json({
      success: true,
      data: {
        prize,
        newBalance: newBalance.recordset[0]?.Coins || 0
      }
    });
  } catch (err) {
    console.error('Roulette error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
