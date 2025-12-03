const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// POST /api/coupons/redeem
router.post('/redeem', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    const pool = await poolPromise;

    // Find coupon
    const couponResult = await pool.request()
      .input('code', sql.VarChar, code)
      .query(`
        SELECT * FROM web_coupons 
        WHERE Code = @code AND IsActive = 1 AND (MaxUses IS NULL OR Uses < MaxUses)
        AND (ExpiresAt IS NULL OR ExpiresAt > GETDATE())
      `);

    if (couponResult.recordset.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid or expired coupon' });
    }

    const coupon = couponResult.recordset[0];

    // Check if user already used this coupon
    const usedResult = await pool.request()
      .input('accountId', sql.Int, req.user.id)
      .input('couponId', sql.Int, coupon.Id)
      .query('SELECT * FROM web_coupon_uses WHERE AccountId = @accountId AND CouponId = @couponId');

    if (usedResult.recordset.length > 0) {
      return res.status(400).json({ success: false, error: 'You have already used this coupon' });
    }

    // Apply coupon reward
    await pool.request()
      .input('accountId', sql.Int, req.user.id)
      .input('coins', sql.Int, coupon.Coins)
      .query('UPDATE account SET Coins = Coins + @coins WHERE AccountId = @accountId');

    // Record usage
    await pool.request()
      .input('accountId', sql.Int, req.user.id)
      .input('couponId', sql.Int, coupon.Id)
      .query('INSERT INTO web_coupon_uses (AccountId, CouponId, UsedAt) VALUES (@accountId, @couponId, GETDATE())');

    // Update coupon uses
    await pool.request()
      .input('couponId', sql.Int, coupon.Id)
      .query('UPDATE web_coupons SET Uses = Uses + 1 WHERE Id = @couponId');

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
