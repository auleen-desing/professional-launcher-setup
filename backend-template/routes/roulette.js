const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const SPIN_COST = 2500;
const PRIZES = [
  { id: 1, name: '500 Coins', type: 'coins', value: 500, chance: 25 },
  { id: 2, name: '1000 Coins', type: 'coins', value: 1000, chance: 20 },
  { id: 3, name: '2500 Coins', type: 'coins', value: 2500, chance: 15 },
  { id: 4, name: '5000 Coins', type: 'coins', value: 5000, chance: 10 },
  { id: 5, name: 'SP Card Box', type: 'item', value: 4099, chance: 10 },
  { id: 6, name: 'Wings Box', type: 'item', value: 5000, chance: 5 },
  { id: 7, name: '10000 Coins', type: 'coins', value: 10000, chance: 5 },
  { id: 8, name: 'Jackpot!', type: 'coins', value: 50000, chance: 1 },
  { id: 9, name: 'Try Again', type: 'coins', value: 100, chance: 9 }
];

// GET /api/roulette/prizes
router.get('/prizes', (req, res) => {
  res.json({ success: true, data: { prizes: PRIZES, spinCost: SPIN_COST } });
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

    // Deduct spin cost
    await pool.request()
      .input('id', sql.Int, req.user.id)
      .input('cost', sql.Int, SPIN_COST)
      .query('UPDATE account SET Coins = Coins - @cost WHERE AccountId = @id');

    // Determine prize (weighted random)
    const random = Math.random() * 100;
    let cumulative = 0;
    let prize = PRIZES[PRIZES.length - 1];
    
    for (const p of PRIZES) {
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
