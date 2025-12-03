const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// GET /api/shop/items
router.get('/items', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT Id, ItemVNum, Name, Description, Price, Category, Stock, ImageUrl
        FROM web_shop_items 
        WHERE IsActive = 1
        ORDER BY Category, Name
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    // Return mock data if table doesn't exist
    res.json({ 
      success: true, 
      data: [
        { Id: 1, ItemVNum: 1012, Name: 'Wings of Death', Price: 5000, Category: 'wings' },
        { Id: 2, ItemVNum: 4099, Name: 'SP Card Box', Price: 2500, Category: 'sp' },
        { Id: 3, ItemVNum: 1030, Name: 'Rare Pet Bead', Price: 3000, Category: 'pets' }
      ]
    });
  }
});

// GET /api/shop/categories
router.get('/categories', async (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'wings', name: 'Wings', icon: '🦋' },
      { id: 'sp', name: 'SP Cards', icon: '🃏' },
      { id: 'pets', name: 'Pets', icon: '🐾' },
      { id: 'costumes', name: 'Costumes', icon: '👗' },
      { id: 'consumables', name: 'Consumables', icon: '🧪' },
      { id: 'equipment', name: 'Equipment', icon: '⚔️' }
    ]
  });
});

// POST /api/shop/purchase
router.post('/purchase', authMiddleware, async (req, res) => {
  try {
    const { itemId, characterId, quantity = 1 } = req.body;
    const pool = await poolPromise;

    // Get item info
    const itemResult = await pool.request()
      .input('itemId', sql.Int, itemId)
      .query('SELECT * FROM web_shop_items WHERE Id = @itemId AND IsActive = 1');

    if (itemResult.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const item = itemResult.recordset[0];
    const totalPrice = item.Price * quantity;

    // Check user coins
    const userResult = await pool.request()
      .input('id', sql.Int, req.user.id)
      .query('SELECT Coins FROM account WHERE AccountId = @id');

    const userCoins = userResult.recordset[0]?.Coins || 0;
    if (userCoins < totalPrice) {
      return res.status(400).json({ success: false, error: 'Insufficient coins' });
    }

    // Deduct coins
    await pool.request()
      .input('id', sql.Int, req.user.id)
      .input('price', sql.Int, totalPrice)
      .query('UPDATE account SET Coins = Coins - @price WHERE AccountId = @id');

    // Add item to character (insert into mail or inventory)
    await pool.request()
      .input('charId', sql.Int, characterId)
      .input('vnum', sql.Int, item.ItemVNum)
      .input('amount', sql.Int, quantity)
      .query(`
        INSERT INTO mail (ReceiverId, SenderName, Title, Message, ItemVNum, ItemAmount, Date)
        VALUES (@charId, 'WebShop', 'Shop Purchase', 'Your item from the web shop!', @vnum, @amount, GETDATE())
      `);

    // Log purchase
    await pool.request()
      .input('accountId', sql.Int, req.user.id)
      .input('itemId', sql.Int, itemId)
      .input('charId', sql.Int, characterId)
      .input('price', sql.Int, totalPrice)
      .query(`
        INSERT INTO web_shop_logs (AccountId, ItemId, CharacterId, Price, Date)
        VALUES (@accountId, @itemId, @charId, @price, GETDATE())
      `);

    res.json({ 
      success: true, 
      message: 'Purchase successful! Check your in-game mail.',
      data: { newBalance: userCoins - totalPrice }
    });
  } catch (err) {
    console.error('Purchase error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/shop/packages (coin packages)
router.get('/packages', async (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'Starter Pack', coins: 1000, price: 5, bonus: 0 },
      { id: 2, name: 'Explorer Pack', coins: 2500, price: 10, bonus: 250 },
      { id: 3, name: 'Adventurer Pack', coins: 5500, price: 20, bonus: 500 },
      { id: 4, name: 'Hero Pack', coins: 12000, price: 40, bonus: 1200 },
      { id: 5, name: 'Legend Pack', coins: 30000, price: 80, bonus: 5000 }
    ]
  });
});

module.exports = router;
