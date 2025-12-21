/**
 * Pending Coins Helper
 * 
 * This module handles adding coins to the pending system instead of directly
 * to the Account table. This prevents the Game Server from overwriting coins
 * when it saves cached values.
 */

const { sql, poolPromise } = require('../config/database');

/**
 * Add coins to pending queue instead of directly to Account
 * 
 * @param {number} accountId - The account ID to add coins to
 * @param {number} amount - Amount of coins to add
 * @param {string} source - Source type: 'coupon', 'admin', 'donation', 'roulette', 'refund'
 * @param {string} sourceDetail - Additional details (coupon code, admin name, etc.)
 * @param {Date|null} expiresAt - Optional expiration date
 * @returns {Promise<{success: boolean, pendingId?: number, error?: string}>}
 */
async function addPendingCoins(accountId, amount, source, sourceDetail = null, expiresAt = null) {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('accountId', sql.BigInt, accountId)
      .input('amount', sql.Int, amount)
      .input('source', sql.NVarChar(50), source)
      .input('sourceDetail', sql.NVarChar(200), sourceDetail)
      .input('expiresAt', sql.DateTime, expiresAt)
      .query(`
        INSERT INTO web_pending_coins (AccountId, Amount, Source, SourceDetail, Status, CreatedAt, ExpiresAt)
        OUTPUT INSERTED.Id
        VALUES (@accountId, @amount, @source, @sourceDetail, 'pending', GETDATE(), @expiresAt)
      `);
    
    const pendingId = result.recordset[0]?.Id;
    console.log(`[PendingCoins] Added ${amount} pending coins for account ${accountId} (source: ${source}, id: ${pendingId})`);
    
    return { success: true, pendingId };
  } catch (error) {
    console.error('[PendingCoins] Error adding pending coins:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get total pending coins for an account
 * 
 * @param {number} accountId - The account ID
 * @returns {Promise<{total: number, count: number}>}
 */
async function getPendingCoins(accountId) {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('accountId', sql.BigInt, accountId)
      .query(`
        SELECT 
          ISNULL(SUM(Amount), 0) as total,
          COUNT(*) as count
        FROM web_pending_coins
        WHERE AccountId = @accountId 
        AND Status = 'pending'
        AND (ExpiresAt IS NULL OR ExpiresAt > GETDATE())
      `);
    
    return {
      total: result.recordset[0]?.total || 0,
      count: result.recordset[0]?.count || 0
    };
  } catch (error) {
    console.error('[PendingCoins] Error getting pending coins:', error);
    return { total: 0, count: 0 };
  }
}

/**
 * Get detailed list of pending coins for an account
 * 
 * @param {number} accountId - The account ID
 * @returns {Promise<Array>}
 */
async function getPendingCoinsList(accountId) {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('accountId', sql.BigInt, accountId)
      .query(`
        SELECT Id, Amount, Source, SourceDetail, CreatedAt, ExpiresAt
        FROM web_pending_coins
        WHERE AccountId = @accountId 
        AND Status = 'pending'
        AND (ExpiresAt IS NULL OR ExpiresAt > GETDATE())
        ORDER BY CreatedAt DESC
      `);
    
    return result.recordset;
  } catch (error) {
    console.error('[PendingCoins] Error getting pending coins list:', error);
    return [];
  }
}

/**
 * Claim all pending coins for an account (adds to Account.Coins and marks as claimed)
 * This is a fallback for when the Game Server doesn't handle it
 * 
 * @param {number} accountId - The account ID
 * @returns {Promise<{success: boolean, coinsAdded: number, itemsClaimed: number}>}
 */
async function claimPendingCoins(accountId) {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // Lock pending rows for this account to prevent double-claiming
    const pendingResult = await new sql.Request(transaction)
      .input('accountId', sql.BigInt, accountId)
      .query(`
        SELECT Id, Amount
        FROM web_pending_coins WITH (UPDLOCK, HOLDLOCK)
        WHERE AccountId = @accountId
          AND Status = 'pending'
          AND (ExpiresAt IS NULL OR ExpiresAt > GETDATE())
      `);

    const items = pendingResult.recordset || [];
    const itemsClaimed = items.length;
    const coinsAdded = items.reduce((sum, row) => sum + (row?.Amount || 0), 0);

    if (coinsAdded > 0) {
      await new sql.Request(transaction)
        .input('accountId', sql.BigInt, accountId)
        .input('coinsAdded', sql.Int, coinsAdded)
        .query(`
          UPDATE Account
          SET Coins = ISNULL(Coins, 0) + @coinsAdded
          WHERE AccountId = @accountId
        `);

      await new sql.Request(transaction)
        .input('accountId', sql.BigInt, accountId)
        .query(`
          UPDATE web_pending_coins
          SET Status = 'claimed'
          WHERE AccountId = @accountId
            AND Status = 'pending'
            AND (ExpiresAt IS NULL OR ExpiresAt > GETDATE())
        `);

      console.log(`[PendingCoins] Claimed ${coinsAdded} coins for account ${accountId}`);
    }

    await transaction.commit();

    return {
      success: true,
      coinsAdded,
      itemsClaimed,
    };
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (_) {
      // ignore rollback errors
    }

    console.error('[PendingCoins] Error claiming pending coins:', error);
    return { success: false, coinsAdded: 0, itemsClaimed: 0 };
  }
}

module.exports = {
  addPendingCoins,
  getPendingCoins,
  getPendingCoinsList,
  claimPendingCoins
};
