const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { logTransaction } = require('./transactions');

// POST /api/gifts/send - Send coins to another user
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { recipientUsername, amount, message } = req.body;
    const senderId = req.user.id;

    // Validate amount
    const coinsToSend = parseInt(amount);
    if (!coinsToSend || coinsToSend < 1) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    if (coinsToSend > 100000) {
      return res.status(400).json({ success: false, error: 'Maximum gift amount is 100,000 coins' });
    }

    const pool = await poolPromise;

    // Get sender info and verify WebCoins balance
    const senderResult = await pool.request()
      .input('senderId', sql.BigInt, senderId)
      .query('SELECT AccountId, Name, WebCoins FROM Account WHERE AccountId = @senderId');

    if (senderResult.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Sender not found' });
    }

    const sender = senderResult.recordset[0];

    if ((sender.WebCoins || 0) < coinsToSend) {
      return res.status(400).json({ success: false, error: 'Insufficient coins' });
    }

    // Get recipient info
    const recipientResult = await pool.request()
      .input('username', sql.VarChar, recipientUsername.trim())
      .query('SELECT AccountId, Name FROM Account WHERE Name = @username');

    if (recipientResult.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Recipient not found' });
    }

    const recipient = recipientResult.recordset[0];

    // Prevent self-gifting
    if (recipient.AccountId === senderId) {
      return res.status(400).json({ success: false, error: 'You cannot send coins to yourself' });
    }

    // Perform transfer using WebCoins
    await pool.request()
      .input('senderId', sql.BigInt, senderId)
      .input('amount', sql.Int, coinsToSend)
      .query('UPDATE Account SET WebCoins = WebCoins - @amount WHERE AccountId = @senderId');

    await pool.request()
      .input('recipientId', sql.BigInt, recipient.AccountId)
      .input('amount', sql.Int, coinsToSend)
      .query('UPDATE Account SET WebCoins = ISNULL(WebCoins, 0) + @amount WHERE AccountId = @recipientId');

    // Log transactions
    const giftMessage = message ? `: "${message}"` : '';
    
    await logTransaction(
      pool, 
      senderId, 
      'gift_sent', 
      -coinsToSend, 
      `Gift to ${recipient.Name}${giftMessage}`,
      null,
      recipient.AccountId
    );

    await logTransaction(
      pool, 
      recipient.AccountId, 
      'gift_received', 
      coinsToSend, 
      `Gift from ${sender.Name}${giftMessage}`,
      null,
      senderId
    );

    res.json({ 
      success: true, 
      message: `Successfully sent ${coinsToSend} coins to ${recipient.Name}`,
      data: {
        newBalance: (sender.WebCoins || 0) - coinsToSend
      }
    });
  } catch (err) {
    console.error('Gift send error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/gifts/search-users - Search users for gifting
router.get('/search-users', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('query', sql.VarChar, `%${query}%`)
      .input('currentUser', sql.BigInt, req.user.id)
      .query(`
        SELECT TOP 10 AccountId, Name 
        FROM Account 
        WHERE Name LIKE @query 
          AND AccountId != @currentUser
          AND Authority < 2
        ORDER BY Name
      `);

    const users = result.recordset.map(u => ({
      id: u.AccountId,
      username: u.Name
    }));

    res.json({ success: true, data: users });
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
