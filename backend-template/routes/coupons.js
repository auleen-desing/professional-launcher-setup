const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// POST /api/coupons/redeem
router.post('/redeem', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    const pool = await poolPromise;

    console.log('Redeeming coupon:', code, 'for user:', req.user.id);

    // Find coupon
    const couponResult = await pool.request()
      .input('code', sql.NVarChar, code)
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

    // Apply coupon reward
    await pool.request()
      .input('accountId', sql.BigInt, req.user.id)
      .input('coins', sql.Int, coupon.Coins)
      .query('UPDATE Account SET Coins = ISNULL(Coins, 0) + @coins WHERE AccountId = @accountId');

    // Record usage
    await pool.request()
      .input('accountId', sql.BigInt, req.user.id)
      .input('couponId', sql.Int, coupon.Id)
      .query('INSERT INTO web_coupon_redemptions (CouponId, AccountId, RedeemedAt) VALUES (@couponId, @accountId, GETDATE())');

    // Update coupon uses
    await pool.request()
      .input('couponId', sql.Int, coupon.Id)
      .query('UPDATE web_coupons SET CurrentUses = CurrentUses + 1 WHERE Id = @couponId');

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
