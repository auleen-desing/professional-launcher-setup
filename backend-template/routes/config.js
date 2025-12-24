const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// GET /api/config - Get public configuration (no auth required)
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT [name] as name, [value] as value
      FROM dbo.web_config 
      WHERE LTRIM(RTRIM([name])) IN ('COIN_BONUS', 'SHOP_DISCOUNT', 'ROULETTE_SPIN_COST', 'DAILY_FREE_SPINS')
    `);

    const config = {};
    result.recordset.forEach(row => {
      config[row.name] = Number(row.value) || row.value;
    });

    // Provide defaults if table doesn't exist or is empty
    res.json({
      success: true,
      data: {
        COIN_BONUS: config.COIN_BONUS ?? 30,
        SHOP_DISCOUNT: config.SHOP_DISCOUNT ?? 50,
        ROULETTE_SPIN_COST: config.ROULETTE_SPIN_COST ?? 2500,
        DAILY_FREE_SPINS: config.DAILY_FREE_SPINS ?? 0,
      }
    });
  } catch (err) {
    console.error('Config fetch error:', err);
    // Return defaults if table doesn't exist
    res.json({
      success: true,
      data: {
        COIN_BONUS: 30,
        SHOP_DISCOUNT: 50,
        ROULETTE_SPIN_COST: 2500,
        DAILY_FREE_SPINS: 0,
      }
    });
  }
});

// PUT /api/config - Update configuration (admin only)
router.put('/', authMiddleware, adminMiddleware, async (req, res) => {
  const { COIN_BONUS, SHOP_DISCOUNT, ROULETTE_SPIN_COST, DAILY_FREE_SPINS } = req.body;

  try {
    const pool = await poolPromise;

    // Update each config value
    const updates = [
      { key: 'COIN_BONUS', value: COIN_BONUS },
      { key: 'SHOP_DISCOUNT', value: SHOP_DISCOUNT },
      { key: 'ROULETTE_SPIN_COST', value: ROULETTE_SPIN_COST },
      { key: 'DAILY_FREE_SPINS', value: DAILY_FREE_SPINS },
    ];

    for (const update of updates) {
      if (update.value !== undefined) {
        // Validate numeric range (0-100 for percentages, positive for costs)
        const numValue = Number(update.value);
        if (isNaN(numValue) || numValue < 0) continue;
        if ((update.key === 'COIN_BONUS' || update.key === 'SHOP_DISCOUNT') && numValue > 100) continue;

        await pool.request()
          .input('key', sql.NVarChar, update.key)
          .input('value', sql.NVarChar, String(Math.floor(numValue)))
          .query(`
            IF EXISTS (SELECT 1 FROM dbo.web_config WHERE LTRIM(RTRIM([name])) = @key)
              UPDATE dbo.web_config SET [value] = @value WHERE LTRIM(RTRIM([name])) = @key
            ELSE
              INSERT INTO dbo.web_config ([name], [value]) VALUES (@key, @value)
          `);
      }
    }

    res.json({ success: true, message: 'Configuration updated successfully' });
  } catch (err) {
    console.error('Config update error:', err);
    res.status(500).json({ success: false, error: 'Failed to update configuration' });
  }
});

module.exports = router;
