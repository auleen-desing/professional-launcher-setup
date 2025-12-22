const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');


// POST /api/coupons/redeem
router.post('/redeem', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    
    // SECURITY: Validate coupon code format
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, error: 'Coupon code is required' });
    }
    
    // Only allow alphanumeric and dashes, max 50 chars
    const sanitizedCode = code.trim().toUpperCase();
    if (!/^[A-Z0-9\-]{3,50}$/.test(sanitizedCode)) {
      return res.status(400).json({ success: false, error: 'Invalid coupon format' });
    }
    
    const pool = await poolPromise;

    console.log('Redeeming coupon:', sanitizedCode, 'for user:', req.user.id);

    // Find coupon - use CAST to DATE for expiration check to include the entire day
    const couponResult = await pool.request()
      .input('code', sql.NVarChar, sanitizedCode)
      .query(`
        SELECT * FROM web_coupons 
        WHERE Code = @code AND Active = 1 
        AND (MaxUses IS NULL OR CurrentUses < MaxUses)
        AND (ExpiresAt IS NULL OR CAST(ExpiresAt AS DATE) >= CAST(GETDATE() AS DATE))
      `);

    if (couponResult.recordset.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid or expired coupon' });
    }

    const coupon = couponResult.recordset[0];

    // Check if user already used this coupon
    const usedResult = await pool.request()
      .input('accountId', sql.BigInt, req.user.id)
      .input('couponId', sql.Int, coupon.Id)
      .query('SELECT * FROM web_coupon_redemptions WHERE AccountId = @accountId AND CouponId = @couponId');

    if (usedResult.recordset.length > 0) {
      return res.status(400).json({ success: false, error: 'You have already used this coupon' });
    }

    // SECURITY: Use transaction to prevent race conditions
    const transaction = pool.transaction();
    await transaction.begin();

    try {
      // Record usage first (prevents double-spend)
      await transaction.request()
        .input('accountId', sql.BigInt, req.user.id)
        .input('couponId', sql.Int, coupon.Id)
        .query('INSERT INTO web_coupon_redemptions (CouponId, AccountId, RedeemedAt) VALUES (@couponId, @accountId, GETDATE())');

      // Update coupon uses
      await transaction.request()
        .input('couponId', sql.Int, coupon.Id)
        .query('UPDATE web_coupons SET CurrentUses = CurrentUses + 1 WHERE Id = @couponId');

      // Add coins directly to WebCoins (separate from game coins)
      await transaction.request()
        .input('accountId', sql.BigInt, req.user.id)
        .input('amount', sql.Int, coupon.Coins)
        .query('UPDATE Account SET WebCoins = ISNULL(WebCoins, 0) + @amount WHERE AccountId = @accountId');

      await transaction.commit();
    } catch (txError) {
      await transaction.rollback();
      throw txError;
    }

    // Get current balance
    const balanceResult = await pool.request()
      .input('accountId', sql.BigInt, req.user.id)
      .query('SELECT Coins, WebCoins FROM Account WHERE AccountId = @accountId');
    
    const gameCoins = balanceResult.recordset[0]?.Coins || 0;
    const webCoins = balanceResult.recordset[0]?.WebCoins || 0;

    console.log('Coupon redeemed successfully:', coupon.Coins, 'coins added to WebCoins. New balance:', webCoins);

    res.json({ 
      success: true, 
      message: `¡Cupón canjeado! Recibiste ${coupon.Coins} coins.`,
      data: { 
        coins: coupon.Coins, 
        currentBalance: webCoins,
        gameCoins: gameCoins,
        totalCoins: gameCoins + webCoins
      }
    });
  } catch (err) {
    console.error('Coupon error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
