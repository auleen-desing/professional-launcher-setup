const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// GET /api/shop/items - Get all shop items with categories
router.get('/items', async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Get items with category names from web_item_shop_items
    const result = await pool.request().query(`
      SELECT 
        i.id,
        i.vnum,
        i.amount,
        i.price,
        i.description,
        i.unique_purchase,
        i.show_in_home,
        i.upgrade,
        i.rarity,
        i.category_id,
        i.speed,
        i.level,
        i.discount,
        c.name as category_name
      FROM web_item_shop_items i
      LEFT JOIN web_item_shop_categories c ON i.category_id = c.id
      ORDER BY c.name, i.price
    `);

    const items = result.recordset.map(item => ({
      id: item.id,
      name: `Item ${item.vnum}`,
      itemVNum: item.vnum,
      quantity: parseInt(item.amount) || 1,
      price: item.price,
      description: item.description || '',
      category: item.category_name || 'General',
      categoryId: item.category_id,
      upgrade: item.upgrade,
      rarity: item.rarity,
      speed: item.speed,
      level: item.level,
      uniquePurchase: item.unique_purchase,
      showInHome: item.show_in_home,
      discount: item.discount || 0
    }));

    res.json({ success: true, data: items });
  } catch (err) {
    console.error('Shop items error:', err);
    res.status(500).json({ success: false, error: 'Failed to load shop items' });
  }
});

// GET /api/shop/categories - Get all categories from web_item_shop_categories
router.get('/categories', async (req, res) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request().query(`
      SELECT id, name, master_category
      FROM web_item_shop_categories
      ORDER BY name
    `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('Categories error:', err);
    res.status(500).json({ success: false, error: 'Failed to load categories' });
  }
});

// GET /api/shop/packages - Get coin packages from web_item_shop_coin_prices
router.get('/packages', async (req, res) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request().query(`
      SELECT id, coins, payment_method, price
      FROM web_item_shop_coin_prices
      WHERE payment_method = 'paypal'
      ORDER BY price
    `);

    const packages = result.recordset.map(pkg => ({
      id: pkg.id,
      coins: pkg.coins,
      price: pkg.price,
      bonus: 0
    }));

    res.json({ success: true, data: packages });
  } catch (err) {
    console.error('Packages error:', err);
    res.status(500).json({ success: false, error: 'Failed to load packages' });
  }
});

// POST /api/shop/purchase - Purchase an item
router.post('/purchase', authMiddleware, async (req, res) => {
  const { itemId, characterId } = req.body;

  if (!itemId) {
    return res.status(400).json({ success: false, error: 'Item ID is required' });
  }

  try {
    const pool = await poolPromise;

    // Get item details from web_item_shop_items
    const itemResult = await pool.request()
      .input('itemId', sql.Int, itemId)
      .query('SELECT * FROM web_item_shop_items WHERE id = @itemId');

    if (itemResult.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const item = itemResult.recordset[0];
    
    // Calculate final price with discount
    const discountPercent = item.discount || 0;
    const finalPrice = discountPercent > 0 
      ? Math.floor(item.price * (1 - discountPercent / 100)) 
      : item.price;

    // Get user's current coins
    const userResult = await pool.request()
      .input('accountId', sql.BigInt, req.user.id)
      .query('SELECT coins FROM Account WHERE AccountId = @accountId');

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userCoins = userResult.recordset[0]?.coins || 0;

    if (userCoins < finalPrice) {
      return res.status(400).json({ 
        success: false, 
        error: `Insufficient coins. You need ${finalPrice} coins.` 
      });
    }

    // Check if unique purchase and already purchased (skip if table doesn't exist)
    if (item.unique_purchase) {
      try {
        const purchaseCheck = await pool.request()
          .input('accountId', sql.BigInt, req.user.id)
          .input('itemId', sql.Int, itemId)
          .query(`
            SELECT COUNT(*) as count 
            FROM web_shop_logs 
            WHERE AccountId = @accountId AND ItemId = @itemId
          `);
        
        if (purchaseCheck.recordset[0].count > 0) {
          return res.status(400).json({ 
            success: false, 
            error: 'You have already purchased this unique item' 
          });
        }
      } catch (checkError) {
        console.log('Unique purchase check skipped - table may not exist');
      }
    }

    // Always get the FIRST character on the account (by CharacterId)
    const charResult = await pool.request()
      .input('accountId', sql.BigInt, req.user.id)
      .query('SELECT TOP 1 CharacterId FROM character WHERE AccountId = @accountId ORDER BY CharacterId ASC');
    
    if (charResult.recordset.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No character found. Create a character first.' 
      });
    }
    const targetCharId = charResult.recordset[0].CharacterId;

    // Deduct coins directly (using discounted price)
    await pool.request()
      .input('accountId', sql.BigInt, req.user.id)
      .input('price', sql.Int, finalPrice)
      .query('UPDATE account SET Coins = Coins - @price WHERE AccountId = @accountId');

    // Send item to character mail (use buyer's own character as sender - self-mail)
    await pool.request()
      .input('receiverId', sql.BigInt, targetCharId)
      .input('senderId', sql.BigInt, targetCharId)
      .input('vnum', sql.SmallInt, item.vnum)
      .input('amount', sql.SmallInt, parseInt(item.amount) || 1)
      .input('upgrade', sql.TinyInt, item.upgrade || 0)
      .input('rarity', sql.TinyInt, item.rarity || 0)
      .input('level', sql.TinyInt, item.level || 0)
      .input('design', sql.SmallInt, 0)
      .input('eqPacket', sql.NVarChar, '0')
      .query(`
        INSERT INTO mail (ReceiverId, SenderId, Date, Title, Message, SenderClass, SenderGender, SenderHairStyle, SenderHairColor, SenderMorphId, IsSenderCopy, IsOpened, AttachmentVNum, AttachmentAmount, AttachmentUpgrade, AttachmentRarity, AttachmentLevel, AttachmentDesign, EqPacket)
        VALUES (@receiverId, @senderId, GETDATE(), 'Web Shop', 'Thank you for your purchase!', 0, 0, 0, 0, 0, 0, 0, @vnum, @amount, @upgrade, @rarity, @level, @design, @eqPacket)
      `);

    // Log the purchase (optional - table may not exist)
    try {
      await pool.request()
        .input('accountId', sql.BigInt, req.user.id)
        .input('itemId', sql.Int, itemId)
        .input('price', sql.Int, finalPrice)
        .query(`
          INSERT INTO web_shop_logs (AccountId, ItemId, Price, PurchaseDate)
          VALUES (@accountId, @itemId, @price, GETDATE())
        `);
    } catch (logError) {
      console.log('Shop log table may not exist:', logError.message);
    }

    // Get new balance
    const newBalanceResult = await pool.request()
      .input('accountId', sql.BigInt, req.user.id)
      .query('SELECT coins FROM account WHERE AccountId = @accountId');

    res.json({ 
      success: true, 
      data: { 
        newBalance: newBalanceResult.recordset[0]?.coins || 0,
        message: 'Item purchased successfully! Check your in-game mail.'
      } 
    });

  } catch (err) {
    console.error('Purchase error:', err.message, err.stack);
    res.status(500).json({ success: false, error: `Purchase failed: ${err.message}` });
  }
});

module.exports = router;
