const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// GET /api/transactions - Get user's transaction history
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const pool = await poolPromise;

    let query = `
      SELECT t.*, 
             a.Name as target_username
      FROM web_transactions t
      LEFT JOIN Account a ON t.target_account_id = a.AccountId
      WHERE t.account_id = @accountId
    `;

    if (type && type !== 'all') {
      query += ` AND t.type = @type`;
    }

    query += ` ORDER BY t.created_at DESC
               OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

    const request = pool.request()
      .input('accountId', sql.BigInt, req.user.id)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit));

    if (type && type !== 'all') {
      request.input('type', sql.VarChar, type);
    }

    const result = await request.query(query);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM web_transactions WHERE account_id = @accountId`;
    if (type && type !== 'all') {
      countQuery += ` AND type = @type`;
    }

    const countRequest = pool.request()
      .input('accountId', sql.BigInt, req.user.id);
    if (type && type !== 'all') {
      countRequest.input('type', sql.VarChar, type);
    }

    const countResult = await countRequest.query(countQuery);

    const transactions = result.recordset.map(t => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      referenceId: t.reference_id,
      targetUsername: t.target_username,
      createdAt: t.created_at
    }));

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.recordset[0].total,
          totalPages: Math.ceil(countResult.recordset[0].total / parseInt(limit))
        }
      }
    });
  } catch (err) {
    console.error('Transactions error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Helper function to log transaction
async function logTransaction(pool, accountId, type, amount, description, referenceId = null, targetAccountId = null) {
  await pool.request()
    .input('accountId', sql.BigInt, accountId)
    .input('type', sql.VarChar, type)
    .input('amount', sql.Int, amount)
    .input('description', sql.NVarChar, description)
    .input('referenceId', sql.VarChar, referenceId)
    .input('targetAccountId', sql.BigInt, targetAccountId)
    .query(`
      INSERT INTO web_transactions (account_id, type, amount, description, reference_id, target_account_id)
      VALUES (@accountId, @type, @amount, @description, @referenceId, @targetAccountId)
    `);
}

module.exports = router;
module.exports.logTransaction = logTransaction;
