const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

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

    const query = type === 'add' 
      ? 'UPDATE account SET Coins = Coins + @amount WHERE AccountId = @userId'
      : 'UPDATE account SET Coins = CASE WHEN Coins >= @amount THEN Coins - @amount ELSE 0 END WHERE AccountId = @userId';

    await pool.request()
      .input('userId', sql.Int, userId)
      .input('amount', sql.Int, amount)
      .query(query);

    // Log the transaction
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

    // Get user info for response
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT Name, Coins FROM account WHERE AccountId = @userId');

    res.json({
      success: true,
      message: `${type === 'add' ? 'Added' : 'Removed'} ${amount} coins`,
      data: {
        username: userResult.recordset[0]?.Name,
        newBalance: userResult.recordset[0]?.Coins
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
    console.error('Admin transactions error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
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
    console.error('Admin modactions error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
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
    console.error('Admin announcements error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
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

module.exports = router;
