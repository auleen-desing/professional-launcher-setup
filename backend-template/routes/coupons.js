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

    // Find coupon
    const couponResult = await pool.request()
      .input('code', sql.NVarChar, sanitizedCode)
      .query(`
        SELECT * FROM web_coupons 
        WHERE Code = @code AND Active = 1 
        AND (MaxUses IS NULL OR CurrentUses < MaxUses)
        AND (ExpiresAt IS NULL OR ExpiresAt > GETDATE())
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

      // Apply coupon reward
      await transaction.request()
        .input('accountId', sql.BigInt, req.user.id)
        .input('coins', sql.Int, coupon.Coins)
        .query('UPDATE Account SET Coins = ISNULL(Coins, 0) + @coins WHERE AccountId = @accountId');

      // Update coupon uses
      await transaction.request()
        .input('couponId', sql.Int, coupon.Id)
        .query('UPDATE web_coupons SET CurrentUses = CurrentUses + 1 WHERE Id = @couponId');
      
      await transaction.commit();
    } catch (txError) {
      await transaction.rollback();
      throw txError;
    }

    console.log('Coupon redeemed successfully:', coupon.Coins, 'coins');

    res.json({ 
      success: true, 
      message: `Coupon redeemed! You received ${coupon.Coins} coins.`,
      data: { coins: coupon.Coins }
    });
  } catch (err) {
    console.error('Coupon error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
