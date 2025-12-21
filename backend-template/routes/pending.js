const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { getPendingCoins, getPendingCoinsList, claimPendingCoins } = require('../utils/pendingCoins');

// GET /api/pending/coins - Get user's pending coins
router.get('/coins', authMiddleware, async (req, res) => {
  try {
    const pending = await getPendingCoins(req.user.id);
    const list = await getPendingCoinsList(req.user.id);
    
    res.json({
      success: true,
      data: {
        total: pending.total,
        count: pending.count,
        items: list.map(item => ({
          id: item.Id,
          amount: item.Amount,
          source: item.Source,
          detail: item.SourceDetail,
          createdAt: item.CreatedAt,
          expiresAt: item.ExpiresAt
        }))
      }
    });
  } catch (err) {
    console.error('Pending coins error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/pending/claim - Manual claim (fallback, not recommended)
// This should normally be done by the Game Server
router.post('/claim', authMiddleware, async (req, res) => {
  try {
    const result = await claimPendingCoins(req.user.id);
    
    if (result.coinsAdded > 0) {
      // Get new balance
      const pool = await poolPromise;
      const balanceResult = await pool.request()
        .input('accountId', sql.BigInt, req.user.id)
        .query('SELECT Coins FROM Account WHERE AccountId = @accountId');
      
      res.json({
        success: true,
        message: `Claimed ${result.coinsAdded} coins!`,
        data: {
          coinsAdded: result.coinsAdded,
          itemsClaimed: result.itemsClaimed,
          newBalance: balanceResult.recordset[0]?.Coins || 0
        }
      });
    } else {
      res.json({
        success: true,
        message: 'No pending coins to claim',
        data: { coinsAdded: 0, itemsClaimed: 0 }
      });
    }
  } catch (err) {
    console.error('Claim pending error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================
// GAME SERVER ENDPOINT (requires server key)
// ============================================

// POST /api/pending/game-claim - Called by Game Server when player logs in
router.post('/game-claim', async (req, res) => {
  try {
    const { accountId, serverKey } = req.body;
    
    // Validate server key
    const expectedKey = process.env.GAME_SERVER_KEY || 'your-secret-game-server-key';
    if (serverKey !== expectedKey) {
      return res.status(403).json({ success: false, error: 'Invalid server key' });
    }
    
    if (!accountId) {
      return res.status(400).json({ success: false, error: 'Account ID required' });
    }
    
    const result = await claimPendingCoins(accountId);
    
    res.json({
      success: true,
      data: {
        coinsAdded: result.coinsAdded,
        itemsClaimed: result.itemsClaimed
      }
    });
  } catch (err) {
    console.error('Game claim error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/pending/game-check - Game Server checks if user has pending coins
router.get('/game-check/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const serverKey = req.headers['x-server-key'];
    
    // Validate server key
    const expectedKey = process.env.GAME_SERVER_KEY || 'your-secret-game-server-key';
    if (serverKey !== expectedKey) {
      return res.status(403).json({ success: false, error: 'Invalid server key' });
    }
    
    const pending = await getPendingCoins(accountId);
    
    res.json({
      success: true,
      data: {
        hasPending: pending.total > 0,
        total: pending.total,
        count: pending.count
      }
    });
  } catch (err) {
    console.error('Game check error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
