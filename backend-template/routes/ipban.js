const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

// GET /api/admin/ipban/search - Search accounts by IP
router.get('/search', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { ip } = req.query;
    
    if (!ip || ip.length < 3) {
      return res.status(400).json({ success: false, error: 'IP search term must be at least 3 characters' });
    }

    const pool = await poolPromise;
    
    // Search for accounts with matching IP
    const result = await pool.request()
      .input('ip', sql.VarChar, `%${ip}%`)
      .query(`
        SELECT 
          AccountId,
          Name,
          Email,
          Authority,
          RegistrationIP,
          RegistrationDate,
          coins
        FROM Account 
        WHERE RegistrationIP LIKE @ip
        ORDER BY RegistrationDate DESC
      `);

    res.json({ 
      success: true, 
      data: result.recordset.map(acc => ({
        id: acc.AccountId,
        username: acc.Name,
        email: acc.Email,
        authority: acc.Authority,
        ip: acc.RegistrationIP,
        registrationDate: acc.RegistrationDate,
        coins: acc.coins || 0,
        isBanned: acc.Authority === -1
      }))
    });
  } catch (err) {
    console.error('IP search error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/admin/ipban/accounts-by-ip/:ip - Get all accounts from specific IP
router.get('/accounts-by-ip/:ip', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { ip } = req.params;
    
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('ip', sql.VarChar, ip)
      .query(`
        SELECT 
          AccountId,
          Name,
          Email,
          Authority,
          RegistrationIP,
          RegistrationDate,
          coins
        FROM Account 
        WHERE RegistrationIP = @ip
        ORDER BY RegistrationDate DESC
      `);

    res.json({ 
      success: true, 
      data: result.recordset.map(acc => ({
        id: acc.AccountId,
        username: acc.Name,
        email: acc.Email,
        authority: acc.Authority,
        ip: acc.RegistrationIP,
        registrationDate: acc.RegistrationDate,
        coins: acc.coins || 0,
        isBanned: acc.Authority === -1
      }))
    });
  } catch (err) {
    console.error('Accounts by IP error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/admin/ipban/ban-ip - Ban all accounts from an IP
router.post('/ban-ip', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { ip, reason } = req.body;
    
    if (!ip) {
      return res.status(400).json({ success: false, error: 'IP address required' });
    }

    const pool = await poolPromise;
    
    // Get count of accounts to be banned
    const countResult = await pool.request()
      .input('ip', sql.VarChar, ip)
      .query(`SELECT COUNT(*) as count FROM Account WHERE RegistrationIP = @ip AND Authority != -1`);
    
    const count = countResult.recordset[0].count;
    
    // Ban all accounts with this IP (set Authority to -1)
    await pool.request()
      .input('ip', sql.VarChar, ip)
      .query(`UPDATE Account SET Authority = -1 WHERE RegistrationIP = @ip`);

    // Log the action
    await pool.request()
      .input('adminId', sql.BigInt, req.user.id)
      .input('ip', sql.VarChar, ip)
      .input('reason', sql.NVarChar, reason || 'IP Ban')
      .input('count', sql.Int, count)
      .query(`
        INSERT INTO web_mod_actions (UserId, AdminId, ActionType, Reason, Duration)
        VALUES (0, @adminId, 'ip_ban', CONCAT('IP: ', @ip, ' - ', @reason, ' (', @count, ' accounts)'), NULL)
      `);

    console.log(`[ADMIN] IP banned: ${ip} (${count} accounts) by admin ${req.user.id}`);

    res.json({ 
      success: true, 
      message: `Banned ${count} accounts from IP ${ip}` 
    });
  } catch (err) {
    console.error('IP ban error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/admin/ipban/unban-ip - Unban all accounts from an IP
router.post('/unban-ip', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { ip } = req.body;
    
    if (!ip) {
      return res.status(400).json({ success: false, error: 'IP address required' });
    }

    const pool = await poolPromise;
    
    // Get count of accounts to be unbanned
    const countResult = await pool.request()
      .input('ip', sql.VarChar, ip)
      .query(`SELECT COUNT(*) as count FROM Account WHERE RegistrationIP = @ip AND Authority = -1`);
    
    const count = countResult.recordset[0].count;
    
    // Unban all accounts with this IP (set Authority to 0)
    await pool.request()
      .input('ip', sql.VarChar, ip)
      .query(`UPDATE Account SET Authority = 0 WHERE RegistrationIP = @ip AND Authority = -1`);

    console.log(`[ADMIN] IP unbanned: ${ip} (${count} accounts) by admin ${req.user.id}`);

    res.json({ 
      success: true, 
      message: `Unbanned ${count} accounts from IP ${ip}` 
    });
  } catch (err) {
    console.error('IP unban error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/admin/ipban/suspicious - Get IPs with multiple accounts
router.get('/suspicious', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .query(`
        SELECT 
          RegistrationIP as ip,
          COUNT(*) as accountCount,
          SUM(CASE WHEN Authority = -1 THEN 1 ELSE 0 END) as bannedCount,
          MIN(RegistrationDate) as firstRegistration,
          MAX(RegistrationDate) as lastRegistration
        FROM Account 
        WHERE RegistrationIP IS NOT NULL AND RegistrationIP != ''
        GROUP BY RegistrationIP
        HAVING COUNT(*) > 1
        ORDER BY COUNT(*) DESC
      `);

    res.json({ 
      success: true, 
      data: result.recordset.map(row => ({
        ip: row.ip,
        accountCount: row.accountCount,
        bannedCount: row.bannedCount,
        firstRegistration: row.firstRegistration,
        lastRegistration: row.lastRegistration
      }))
    });
  } catch (err) {
    console.error('Suspicious IPs error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
