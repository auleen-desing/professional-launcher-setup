const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// GET /api/titles - Get all titles with user ownership status
router.get('/', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Get all titles from database
    const titlesResult = await pool.request()
      .query(`
        SELECT Id, Name, DisplayName, Description, Price, Rarity, Icon, Color
        FROM web_titles
        ORDER BY Price ASC
      `);
    
    // Get user's owned titles
    const ownedResult = await pool.request()
      .input('accountId', sql.BigInt, req.user.id)
      .query(`
        SELECT TitleId, Equipped
        FROM web_user_titles
        WHERE AccountId = @accountId
      `);
    
    const ownedMap = new Map();
    ownedResult.recordset.forEach(row => {
      ownedMap.set(row.TitleId, { equipped: row.Equipped === 1 || row.Equipped === true });
    });
    
    const titles = titlesResult.recordset.map(t => ({
      id: t.Id,
      name: t.Name,
      displayName: t.DisplayName,
      description: t.Description,
      price: t.Price,
      rarity: t.Rarity,
      icon: t.Icon,
      color: t.Color,
      owned: ownedMap.has(t.Id),
      equipped: ownedMap.get(t.Id)?.equipped || false
    }));

    console.log(`[Titles] User ${req.user.id} fetched ${titles.length} titles`);

    res.json({ success: true, data: titles });
  } catch (err) {
    console.error('[Titles] Fetch error:', err);
    res.status(500).json({ success: false, error: 'Error fetching titles' });
  }
});

// POST /api/titles/purchase - Purchase a title
router.post('/purchase', authMiddleware, async (req, res) => {
  try {
    const { titleId } = req.body;
    
    if (!titleId) {
      return res.status(400).json({ success: false, error: 'Title ID is required' });
    }

    const pool = await poolPromise;
    
    // Get title info
    const titleResult = await pool.request()
      .input('titleId', sql.Int, titleId)
      .query('SELECT Id, DisplayName, Price FROM web_titles WHERE Id = @titleId');
    
    if (titleResult.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Title not found' });
    }
    
    const title = titleResult.recordset[0];
    
    // Check if already owned
    const ownedCheck = await pool.request()
      .input('accountId', sql.BigInt, req.user.id)
      .input('titleId', sql.Int, titleId)
      .query('SELECT 1 FROM web_user_titles WHERE AccountId = @accountId AND TitleId = @titleId');
    
    if (ownedCheck.recordset.length > 0) {
      return res.status(400).json({ success: false, error: 'You already own this title' });
    }
    
    // Check user balance
    const balanceResult = await pool.request()
      .input('accountId', sql.BigInt, req.user.id)
      .query('SELECT coins FROM Account WHERE AccountId = @accountId');
    
    const currentCoins = balanceResult.recordset[0]?.coins || 0;
    
    if (currentCoins < title.Price) {
      return res.status(400).json({ success: false, error: 'Insufficient coins' });
    }
    
    // Deduct coins
    await pool.request()
      .input('accountId', sql.BigInt, req.user.id)
      .input('price', sql.Int, title.Price)
      .query('UPDATE Account SET coins = coins - @price WHERE AccountId = @accountId');
    
    // Add title to user
    await pool.request()
      .input('accountId', sql.BigInt, req.user.id)
      .input('titleId', sql.Int, titleId)
      .query('INSERT INTO web_user_titles (AccountId, TitleId, PurchaseDate, Equipped) VALUES (@accountId, @titleId, GETDATE(), 0)');
    
    // Get new balance
    const newBalanceResult = await pool.request()
      .input('accountId', sql.BigInt, req.user.id)
      .query('SELECT coins FROM Account WHERE AccountId = @accountId');
    
    const newBalance = newBalanceResult.recordset[0]?.coins || 0;

    console.log(`[Titles] User ${req.user.id} purchased title ${title.DisplayName} for ${title.Price} coins`);

    res.json({ 
      success: true, 
      data: { 
        titleId,
        titleName: title.DisplayName,
        newBalance
      } 
    });
  } catch (err) {
    console.error('[Titles] Purchase error:', err);
    res.status(500).json({ success: false, error: 'Error purchasing title' });
  }
});

// POST /api/titles/equip - Equip a title
router.post('/equip', authMiddleware, async (req, res) => {
  try {
    const { titleId } = req.body;
    
    if (!titleId) {
      return res.status(400).json({ success: false, error: 'Title ID is required' });
    }

    const pool = await poolPromise;
    
    // Check if user owns this title
    const ownedCheck = await pool.request()
      .input('accountId', sql.BigInt, req.user.id)
      .input('titleId', sql.Int, titleId)
      .query('SELECT 1 FROM web_user_titles WHERE AccountId = @accountId AND TitleId = @titleId');
    
    if (ownedCheck.recordset.length === 0) {
      return res.status(400).json({ success: false, error: 'You do not own this title' });
    }
    
    // Unequip all titles for this user
    await pool.request()
      .input('accountId', sql.BigInt, req.user.id)
      .query('UPDATE web_user_titles SET Equipped = 0 WHERE AccountId = @accountId');
    
    // Equip the selected title
    await pool.request()
      .input('accountId', sql.BigInt, req.user.id)
      .input('titleId', sql.Int, titleId)
      .query('UPDATE web_user_titles SET Equipped = 1 WHERE AccountId = @accountId AND TitleId = @titleId');
    
    // Get title name for logging
    const titleResult = await pool.request()
      .input('titleId', sql.Int, titleId)
      .query('SELECT DisplayName FROM web_titles WHERE Id = @titleId');

    console.log(`[Titles] User ${req.user.id} equipped title ${titleResult.recordset[0]?.DisplayName}`);

    res.json({ success: true, data: { titleId } });
  } catch (err) {
    console.error('[Titles] Equip error:', err);
    res.status(500).json({ success: false, error: 'Error equipping title' });
  }
});

module.exports = router;
