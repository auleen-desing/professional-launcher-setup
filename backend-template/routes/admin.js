const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const security = require('../middleware/security');

// GET /api/admin/stats - Server statistics
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Get total users
    const usersResult = await pool.request()
      .query('SELECT COUNT(*) as total FROM account');
    
    // Get new users today
    const newTodayResult = await pool.request()
      .query(`SELECT COUNT(*) as total FROM account WHERE CAST(RegistrationDate AS DATE) = CAST(GETDATE() AS DATE)`);
    
    // Get banned users
    const bannedResult = await pool.request()
      .query('SELECT COUNT(*) as total FROM account WHERE Authority = -1');
    
    // Get total coins in circulation
    const coinsResult = await pool.request()
      .query('SELECT SUM(Coins) as total FROM account');
    
    // Get open tickets
    const ticketsResult = await pool.request()
      .query(`SELECT COUNT(*) as total FROM web_tickets WHERE Status = 'open'`);
    
    // Get revenue from donations
    const revenueResult = await pool.request()
      .query(`SELECT SUM(Amount) as total FROM web_donations WHERE Status = 'completed' AND MONTH(CreatedAt) = MONTH(GETDATE()) AND YEAR(CreatedAt) = YEAR(GETDATE())`);

    res.json({
      success: true,
      data: {
        totalUsers: usersResult.recordset[0].total || 0,
        activeUsers: usersResult.recordset[0].total || 0,
        onlinePlayers: 0, // This would need game server integration
        totalCoins: coinsResult.recordset[0].total || 0,
        revenue: revenueResult.recordset[0].total || 0,
        newUsersToday: newTodayResult.recordset[0].total || 0,
        ticketsOpen: ticketsResult.recordset[0].total || 0,
        bannedUsers: bannedResult.recordset[0].total || 0,
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/admin/users - List all users
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT TOP 100
          AccountId as id,
          Name as username,
          Email as email,
          Coins as coins,
          Authority as authority,
          RegistrationDate as createdAt,
          CASE 
            WHEN Authority = -1 THEN 'banned'
            WHEN Authority >= 100 THEN 'admin'
            ELSE 'active'
          END as status,
          CASE 
            WHEN Authority >= 100 THEN 'admin'
            WHEN Authority >= 50 THEN 'moderator'
            WHEN Coins > 100000 THEN 'vip'
            ELSE 'user'
          END as role
        FROM account
        ORDER BY AccountId DESC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/admin/coins - Add/remove coins from user
router.post('/coins', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId, amount, type, reason } = req.body;
    const pool = await poolPromise;

    // Get admin name for logging
    const adminResult = await pool.request()
      .input('adminId', sql.Int, req.user.id)
      .query('SELECT Name FROM Account WHERE AccountId = @adminId');
    const adminName = adminResult.recordset[0]?.Name || 'Admin';

    if (type === 'add') {
      // Add directly to WebCoins
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('amount', sql.Int, amount)
        .query('UPDATE Account SET WebCoins = ISNULL(WebCoins, 0) + @amount WHERE AccountId = @userId');
      
      console.log(`[ADMIN] ${adminName} added ${amount} WebCoins to user ${userId}: ${reason || 'No reason'}`);
    } else {
      // For removing coins, remove from WebCoins first, then game coins if needed
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('amount', sql.Int, amount)
        .query('UPDATE Account SET WebCoins = CASE WHEN WebCoins >= @amount THEN WebCoins - @amount ELSE 0 END WHERE AccountId = @userId');
      
      console.log(`[ADMIN] ${adminName} removed ${amount} WebCoins from user ${userId}: ${reason || 'No reason'}`);
    }

    // Log the transaction (optional - table may not exist)
    try {
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('adminId', sql.Int, req.user.id)
        .input('amount', sql.Int, amount)
        .input('type', sql.VarChar, type)
        .input('reason', sql.NVarChar, reason || '')
        .query(`
          INSERT INTO web_coin_transactions (UserId, AdminId, Amount, Type, Reason, CreatedAt)
          VALUES (@userId, @adminId, @amount, @type, @reason, GETDATE())
        `);
    } catch (logError) {
      console.log('Transaction log skipped - table may not exist');
    }

    // Get user info for response
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT Name, Coins, WebCoins FROM Account WHERE AccountId = @userId');

    const gameCoins = userResult.recordset[0]?.Coins || 0;
    const webCoins = userResult.recordset[0]?.WebCoins || 0;

    res.json({
      success: true,
      message: type === 'add' 
        ? `Added ${amount} WebCoins to user`
        : `Removed ${amount} WebCoins from user`,
      data: {
        username: userResult.recordset[0]?.Name,
        newBalance: webCoins,
        gameCoins: gameCoins,
        totalCoins: gameCoins + webCoins
      }
    });
  } catch (err) {
    console.error('Admin coins error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/admin/ban - Ban a user
router.post('/ban', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input('userId', sql.Int, userId)
      .query('UPDATE account SET Authority = -1 WHERE AccountId = @userId');

    // Log mod action
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('adminId', sql.Int, req.user.id)
      .input('action', sql.VarChar, 'ban')
      .input('reason', sql.NVarChar, reason || '')
      .query(`
        INSERT INTO web_mod_actions (UserId, AdminId, Action, Reason, CreatedAt)
        VALUES (@userId, @adminId, @action, @reason, GETDATE())
      `);

    res.json({ success: true, message: 'User banned successfully' });
  } catch (err) {
    console.error('Admin ban error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/admin/unban - Unban a user
router.post('/unban', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input('userId', sql.Int, userId)
      .query('UPDATE account SET Authority = 0 WHERE AccountId = @userId');

    // Log mod action
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('adminId', sql.Int, req.user.id)
      .input('action', sql.VarChar, 'unban')
      .input('reason', sql.NVarChar, 'Manual unban')
      .query(`
        INSERT INTO web_mod_actions (UserId, AdminId, Action, Reason, CreatedAt)
        VALUES (@userId, @adminId, @action, @reason, GETDATE())
      `);

    res.json({ success: true, message: 'User unbanned successfully' });
  } catch (err) {
    console.error('Admin unban error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/admin/transactions - Get coin transactions
router.get('/transactions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT TOP 50
          t.Id as id,
          t.UserId as userId,
          a.Name as username,
          t.Amount as amount,
          t.Type as type,
          t.Reason as reason,
          t.AdminId as adminId,
          t.CreatedAt as createdAt
        FROM web_coin_transactions t
        LEFT JOIN account a ON t.UserId = a.AccountId
        ORDER BY t.CreatedAt DESC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.log('Transactions table may not exist');
    res.json({ success: true, data: [] });
  }
});

// GET /api/admin/modactions - Get moderation actions
router.get('/modactions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT TOP 50
          m.Id as id,
          m.UserId as userId,
          u.Name as username,
          m.Action as action,
          m.Reason as reason,
          m.AdminId as adminId,
          a.Name as adminName,
          m.CreatedAt as createdAt
        FROM web_mod_actions m
        LEFT JOIN account u ON m.UserId = u.AccountId
        LEFT JOIN account a ON m.AdminId = a.AccountId
        ORDER BY m.CreatedAt DESC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.log('Mod actions table may not exist');
    res.json({ success: true, data: [] });
  }
});

// GET /api/admin/announcements - Get announcements
router.get('/announcements', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT 
          Id as id,
          Title as title,
          Content as content,
          Type as type,
          Priority as priority,
          Active as active,
          ExpiresAt as expiresAt,
          CreatedAt as createdAt,
          Author as author
        FROM web_announcements
        ORDER BY CreatedAt DESC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.log('Announcements table may not exist');
    res.json({ success: true, data: [] });
  }
});

// POST /api/admin/announcements - Create announcement
router.post('/announcements', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, content, type, priority, active, expiresAt } = req.body;
    const pool = await poolPromise;

    // Get admin name
    const adminResult = await pool.request()
      .input('id', sql.Int, req.user.id)
      .query('SELECT Name FROM account WHERE AccountId = @id');

    const result = await pool.request()
      .input('title', sql.NVarChar, title)
      .input('content', sql.NVarChar, content)
      .input('type', sql.VarChar, type || 'info')
      .input('priority', sql.VarChar, priority || 'normal')
      .input('active', sql.Bit, active !== false)
      .input('expiresAt', sql.DateTime, expiresAt || null)
      .input('author', sql.NVarChar, adminResult.recordset[0]?.Name || 'Admin')
      .query(`
        INSERT INTO web_announcements (Title, Content, Type, Priority, Active, ExpiresAt, CreatedAt, Author)
        OUTPUT INSERTED.Id
        VALUES (@title, @content, @type, @priority, @active, @expiresAt, GETDATE(), @author)
      `);

    res.json({ success: true, data: { id: result.recordset[0].Id } });
  } catch (err) {
    console.error('Admin create announcement error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/admin/announcements/:id - Toggle announcement
router.put('/announcements/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input('id', sql.Int, id)
      .input('active', sql.Bit, active)
      .query('UPDATE web_announcements SET Active = @active WHERE Id = @id');

    res.json({ success: true, message: 'Announcement updated' });
  } catch (err) {
    console.error('Admin toggle announcement error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/admin/announcements/:id - Delete announcement
router.delete('/announcements/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM web_announcements WHERE Id = @id');

    res.json({ success: true, message: 'Announcement deleted' });
  } catch (err) {
    console.error('Admin delete announcement error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== COUPONS ====================

// GET /api/admin/coupons - List all coupons
router.get('/coupons', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT Id, Code, Coins, MaxUses, CurrentUses, Active, ExpiresAt, CreatedAt
      FROM web_coupons
      ORDER BY CreatedAt DESC
    `);
    
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('Get coupons error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/admin/coupons/:id/redemptions - Get redemptions for a specific coupon
router.get('/coupons/:id/redemptions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('couponId', sql.Int, id)
      .query(`
        SELECT 
          r.Id,
          r.AccountId,
          a.Name as AccountName,
          r.RedeemedAt
        FROM web_coupon_redemptions r
        LEFT JOIN Account a ON r.AccountId = a.AccountId
        WHERE r.CouponId = @couponId
        ORDER BY r.RedeemedAt DESC
      `);
    
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('Get coupon redemptions error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/admin/coupons - Create a new coupon
router.post('/coupons', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { code, coins, maxUses, expiresAt } = req.body;
    
    // Validate
    if (!code || typeof code !== 'string' || code.length < 3) {
      return res.status(400).json({ success: false, error: 'Invalid coupon code' });
    }
    
    if (!coins || coins <= 0) {
      return res.status(400).json({ success: false, error: 'Coins must be greater than 0' });
    }
    
    const pool = await poolPromise;
    
    // Check if code exists
    const existing = await pool.request()
      .input('code', sql.NVarChar, code.toUpperCase())
      .query('SELECT Id FROM web_coupons WHERE Code = @code');
    
    if (existing.recordset.length > 0) {
      return res.status(400).json({ success: false, error: 'Coupon code already exists' });
    }
    
    // Create coupon
    await pool.request()
      .input('code', sql.NVarChar, code.toUpperCase())
      .input('coins', sql.Int, coins)
      .input('maxUses', sql.Int, maxUses || null)
      .input('expiresAt', sql.DateTime, expiresAt ? new Date(expiresAt) : null)
      .query(`
        INSERT INTO web_coupons (Code, Coins, MaxUses, CurrentUses, Active, ExpiresAt, CreatedAt)
        VALUES (@code, @coins, @maxUses, 0, 1, @expiresAt, GETDATE())
      `);
    
    console.log(`[ADMIN] Coupon created: ${code} - ${coins} coins`);
    
    res.json({ success: true, message: 'Coupon created successfully' });
  } catch (err) {
    console.error('Create coupon error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/admin/coupons/:id - Update coupon
router.put('/coupons/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { active, coins, maxUses, expiresAt } = req.body;
    
    const pool = await poolPromise;
    
    // Build dynamic update query
    let updates = [];
    const request = pool.request().input('id', sql.Int, id);
    
    if (active !== undefined) {
      updates.push('Active = @active');
      request.input('active', sql.Bit, active ? 1 : 0);
    }
    
    if (coins !== undefined) {
      updates.push('Coins = @coins');
      request.input('coins', sql.Int, coins);
    }
    
    if (maxUses !== undefined) {
      updates.push('MaxUses = @maxUses');
      request.input('maxUses', sql.Int, maxUses);
    }
    
    if (expiresAt !== undefined) {
      updates.push('ExpiresAt = @expiresAt');
      request.input('expiresAt', sql.DateTime, expiresAt ? new Date(expiresAt) : null);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }
    
    await request.query(`UPDATE web_coupons SET ${updates.join(', ')} WHERE Id = @id`);
    
    res.json({ success: true, message: 'Coupon updated successfully' });
  } catch (err) {
    console.error('Update coupon error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/admin/coupons/:id - Delete coupon
router.delete('/coupons/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const pool = await poolPromise;
    
    // Delete redemptions first
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM web_coupon_redemptions WHERE CouponId = @id');
    
    // Delete coupon
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM web_coupons WHERE Id = @id');
    
    console.log(`[ADMIN] Coupon deleted: ID ${id}`);
    
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (err) {
    console.error('Delete coupon error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== BLOCKED IPs ====================

// GET /api/admin/blocked-ips - Get all blocked IPs
router.get('/blocked-ips', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const blockedData = security.getBlockedIPs();
    
    res.json({ 
      success: true, 
      data: blockedData,
      config: {
        blockDuration: security.CONFIG.BLOCK_DURATION / 1000 / 60, // in minutes
        burstLimit: security.CONFIG.BURST_DETECTION.MAX_REQUESTS,
        burstWindow: security.CONFIG.BURST_DETECTION.WINDOW_MS / 1000, // in seconds
        authLimit: security.CONFIG.AUTH_RATE_LIMIT.MAX_REQUESTS,
        authWindow: security.CONFIG.AUTH_RATE_LIMIT.WINDOW_MS / 1000 / 60, // in minutes
      }
    });
  } catch (err) {
    console.error('Get blocked IPs error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/admin/block-ip - Manually block an IP
router.post('/block-ip', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { ip, reason } = req.body;
    
    if (!ip || typeof ip !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid IP address' });
    }
    
    security.manualBlockIP(ip, reason || 'Blocked by admin');
    console.log(`[ADMIN] IP manually blocked: ${ip} by admin ${req.user.username}`);
    
    res.json({ success: true, message: `IP ${ip} has been blocked` });
  } catch (err) {
    console.error('Block IP error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/admin/unblock-ip/:ip - Unblock an IP
router.delete('/unblock-ip/:ip', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { ip } = req.params;
    
    security.unblockIP(ip);
    console.log(`[ADMIN] IP unblocked: ${ip} by admin ${req.user.username}`);
    
    res.json({ success: true, message: `IP ${ip} has been unblocked` });
  } catch (err) {
    console.error('Unblock IP error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
