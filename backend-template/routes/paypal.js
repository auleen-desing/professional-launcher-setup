const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const crypto = require('crypto');
const https = require('https');
const { authMiddleware } = require('../middleware/auth');

// Create pending donation record
router.post('/create-donation', authMiddleware, async (req, res) => {
  try {
    const { packageId, coins, amount } = req.body;
    const accountId = req.user.id;

    if (!packageId || !coins || !amount) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Generate unique transaction ID
    const transactionId = `NOVA-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const pool = await poolPromise;
    
    // Create pending donation record
    await pool.request()
      .input('transactionId', sql.VarChar(100), transactionId)
      .input('accountId', sql.Int, accountId)
      .input('packageId', sql.VarChar(50), packageId)
      .input('coins', sql.Int, coins)
      .input('amount', sql.Decimal(10, 2), amount)
      .input('status', sql.VarChar(20), 'pending')
      .query(`
        INSERT INTO web_donations (transaction_id, account_id, package_id, coins, amount, status, created_at)
        VALUES (@transactionId, @accountId, @packageId, @coins, @amount, @status, GETDATE())
      `);

    console.log(`[PayPal] Created pending donation: ${transactionId} for account ${accountId}`);

    res.json({ success: true, transactionId });
  } catch (error) {
    console.error('[PayPal] Create donation error:', error);
    res.status(500).json({ success: false, error: 'Failed to create donation record' });
  }
});

// Test endpoint to verify IPN URL is accessible
router.get('/ipn-test', (req, res) => {
  console.log('[PayPal IPN] Test endpoint hit');
  res.json({ success: true, message: 'IPN endpoint is accessible', timestamp: new Date() });
});

// PayPal IPN handler
router.post('/ipn', async (req, res) => {
  console.log('[PayPal IPN] ========== RECEIVED ==========');
  console.log('[PayPal IPN] Method:', req.method);
  console.log('[PayPal IPN] Content-Type:', req.headers['content-type']);
  console.log('[PayPal IPN] Raw body:', JSON.stringify(req.body, null, 2));

  // IMPORTANT: Respond to PayPal immediately with 200
  res.status(200).send('OK');

  try {
    const params = req.body;

    // Log ALL received fields for debugging
    console.log('[PayPal IPN] All fields received:');
    Object.keys(params).forEach(key => {
      console.log(`  ${key}: ${params[key]}`);
    });

    // Extract relevant fields
    const paymentStatus = params.payment_status;
    const transactionId = params.custom; // Our transaction ID
    const paypalTxnId = params.txn_id;
    const receiverEmail = params.receiver_email;
    const paymentAmount = parseFloat(params.mc_gross) || 0;
    const itemNumber = params.item_number;

    console.log('[PayPal IPN] Extracted values:');
    console.log(`  payment_status: ${paymentStatus}`);
    console.log(`  custom (our txn): ${transactionId}`);
    console.log(`  txn_id (paypal): ${paypalTxnId}`);
    console.log(`  receiver_email: ${receiverEmail}`);
    console.log(`  mc_gross: ${paymentAmount}`);
    console.log(`  item_number: ${itemNumber}`);

    // Skip test/verification IPNs
    if (paypalTxnId === 'TEST123' || !paypalTxnId) {
      console.log('[PayPal IPN] Skipping test/verification IPN');
      return;
    }

    // Only process completed payments
    if (paymentStatus !== 'Completed') {
      console.log(`[PayPal IPN] Payment not completed: ${paymentStatus}`);
      return;
    }

    // Verify receiver email matches (optional check)
    const expectedEmail = process.env.PAYPAL_EMAIL || 'pincjx771@gmail.com';
    if (receiverEmail && receiverEmail.toLowerCase() !== expectedEmail.toLowerCase()) {
      console.error(`[PayPal IPN] Receiver email mismatch: ${receiverEmail} vs ${expectedEmail}`);
      return;
    }

    console.log('[PayPal IPN] Processing completed payment...');

    const pool = await poolPromise;

    // First try to find by custom field (our transaction ID)
    let donationResult = await pool.request()
      .input('transactionId', sql.VarChar(100), transactionId || '')
      .query(`
        SELECT * FROM web_donations 
        WHERE transaction_id = @transactionId AND status = 'pending'
      `);

    // If not found by custom, try to find the most recent pending donation
    // matching the amount (fallback for when custom field doesn't arrive)
    if (!donationResult.recordset || donationResult.recordset.length === 0) {
      console.log('[PayPal IPN] Not found by custom field, trying amount match...');
      
      donationResult = await pool.request()
        .input('amount', sql.Decimal(10, 2), paymentAmount)
        .query(`
          SELECT TOP 1 * FROM web_donations 
          WHERE status = 'pending' 
          AND ABS(amount - @amount) < 0.5
          ORDER BY created_at DESC
        `);
    }

    if (!donationResult.recordset || donationResult.recordset.length === 0) {
      console.error(`[PayPal IPN] No matching pending donation found`);
      console.error(`[PayPal IPN] Searched for: custom=${transactionId}, amount=${paymentAmount}`);
      return;
    }

    const donation = donationResult.recordset[0];
    console.log(`[PayPal IPN] Found donation: ${donation.transaction_id}, account: ${donation.account_id}, coins: ${donation.coins}`);

    // Update donation status and add PayPal transaction ID
    await pool.request()
      .input('id', sql.Int, donation.id)
      .input('paypalTxnId', sql.VarChar(100), paypalTxnId)
      .query(`
        UPDATE web_donations 
        SET status = 'completed', paypal_txn_id = @paypalTxnId, completed_at = GETDATE()
        WHERE id = @id
      `);

    // Credit coins to account
    await pool.request()
      .input('accountId', sql.Int, donation.account_id)
      .input('coins', sql.Int, donation.coins)
      .query(`
        UPDATE Account SET coins = ISNULL(coins, 0) + @coins WHERE AccountId = @accountId
      `);

    console.log(`[PayPal IPN] SUCCESS: Credited ${donation.coins} coins to account ${donation.account_id}`);

  } catch (error) {
    console.error('[PayPal IPN] Error processing:', error);
  }
});

// Admin endpoint to manually complete a donation
router.post('/admin/complete-donation', authMiddleware, async (req, res) => {
  try {
    const { transactionId } = req.body;
    const adminId = req.user.id;

    // Check if user is admin (authority >= 100)
    const pool = await poolPromise;
    const adminCheck = await pool.request()
      .input('accountId', sql.Int, adminId)
      .query(`SELECT Authority FROM Account WHERE AccountId = @accountId`);

    if (!adminCheck.recordset[0] || adminCheck.recordset[0].Authority < 100) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    // Find the pending donation
    const donationResult = await pool.request()
      .input('transactionId', sql.VarChar(100), transactionId)
      .query(`
        SELECT * FROM web_donations 
        WHERE transaction_id = @transactionId AND status = 'pending'
      `);

    if (!donationResult.recordset || donationResult.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Pending donation not found' });
    }

    const donation = donationResult.recordset[0];

    // Update donation status
    await pool.request()
      .input('transactionId', sql.VarChar(100), transactionId)
      .query(`
        UPDATE web_donations 
        SET status = 'completed', completed_at = GETDATE()
        WHERE transaction_id = @transactionId
      `);

    // Credit coins to account
    await pool.request()
      .input('accountId', sql.Int, donation.account_id)
      .input('coins', sql.Int, donation.coins)
      .query(`
        UPDATE Account SET coins = ISNULL(coins, 0) + @coins WHERE AccountId = @accountId
      `);

    console.log(`[PayPal Admin] Manually completed donation ${transactionId}: ${donation.coins} coins to account ${donation.account_id}`);

    res.json({ 
      success: true, 
      message: `Credited ${donation.coins} coins to account ${donation.account_id}` 
    });
  } catch (error) {
    console.error('[PayPal Admin] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to complete donation' });
  }
});

// Get all pending donations (admin only)
router.get('/admin/pending-donations', authMiddleware, async (req, res) => {
  try {
    const adminId = req.user.id;

    const pool = await poolPromise;
    const adminCheck = await pool.request()
      .input('accountId', sql.Int, adminId)
      .query(`SELECT Authority FROM Account WHERE AccountId = @accountId`);

    if (!adminCheck.recordset[0] || adminCheck.recordset[0].Authority < 100) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const result = await pool.request()
      .query(`
        SELECT d.*, a.Name as account_name
        FROM web_donations d
        LEFT JOIN Account a ON d.account_id = a.AccountId
        WHERE d.status = 'pending'
        ORDER BY d.created_at DESC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('[PayPal Admin] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pending donations' });
  }
});

// Check donation status (for frontend polling)
router.get('/donation-status/:transactionId', authMiddleware, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const accountId = req.user.id;

    const pool = await poolPromise;
    const result = await pool.request()
      .input('transactionId', sql.VarChar(100), transactionId)
      .input('accountId', sql.Int, accountId)
      .query(`
        SELECT status, coins FROM web_donations 
        WHERE transaction_id = @transactionId AND account_id = @accountId
      `);

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Donation not found' });
    }

    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error('[PayPal] Status check error:', error);
    res.status(500).json({ success: false, error: 'Failed to check status' });
  }
});

module.exports = router;
