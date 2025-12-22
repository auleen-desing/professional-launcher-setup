const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const crypto = require('crypto');
const { authMiddleware } = require('../middleware/auth');
const { addPendingCoins } = require('../utils/pendingCoins');

// Create pending donation record
router.post('/create-donation', authMiddleware, async (req, res) => {
  try {
    const { packageId, coins, amount } = req.body;
    const accountId = req.user.id;

    console.log('[PayPal] Creating donation:', { packageId, coins, amount, accountId });

    if (!packageId || !coins || !amount) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Generate unique transaction ID
    const transactionId = `NOVA-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const pool = await poolPromise;
    
    // Create pending donation record
    await pool.request()
      .input('transactionId', sql.NVarChar(100), transactionId)
      .input('accountId', sql.BigInt, accountId)
      .input('packageId', sql.Int, parseInt(packageId) || 0)
      .input('coins', sql.Int, coins)
      .input('amount', sql.Decimal(10, 2), amount)
      .query(`
        INSERT INTO web_donations (AccountId, PackageId, TransactionId, PaymentMethod, Amount, Currency, Coins, Status, CreatedAt)
        VALUES (@accountId, @packageId, @transactionId, 'paypal', @amount, 'EUR', @coins, 'pending', GETDATE())
      `);

    console.log(`[PayPal] Created pending donation: ${transactionId} for account ${accountId}`);

    res.json({ success: true, transactionId });
  } catch (error) {
    console.error('[PayPal] Create donation error:', error);
    res.status(500).json({ success: false, error: 'Failed to create donation record' });
  }
});

// Get PayPal config (public endpoint for frontend)
router.get('/config', (req, res) => {
  res.json({ 
    success: true, 
    email: process.env.PAYPAL_EMAIL || 'pincjx771@gmail.com'
  });
});

// Test endpoint to verify IPN URL is accessible
router.get('/ipn-test', (req, res) => {
  console.log('[PayPal IPN] Test endpoint hit');
  res.json({ success: true, message: 'IPN endpoint is accessible', timestamp: new Date() });
});

// PayPal IPN handler with verification
router.post('/ipn', async (req, res) => {
  console.log('[PayPal IPN] ========== RECEIVED ==========');
  console.log('[PayPal IPN] Raw body:', JSON.stringify(req.body, null, 2));

  // IMPORTANT: Respond to PayPal immediately with 200
  res.status(200).send('OK');

  try {
    const params = req.body;

    // ====== SECURITY: Verify IPN with PayPal ======
    const verifyUrl = 'https://ipnpb.paypal.com/cgi-bin/webscr';
    const verifyBody = 'cmd=_notify-validate&' + new URLSearchParams(params).toString();
    
    try {
      const verifyResponse = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: verifyBody
      });
      const verifyResult = await verifyResponse.text();
      
      if (verifyResult !== 'VERIFIED') {
        console.error('[PayPal IPN] SECURITY: IPN verification failed - possible fraud attempt');
        console.error('[PayPal IPN] Verification result:', verifyResult);
        return;
      }
      console.log('[PayPal IPN] IPN verified successfully');
    } catch (verifyError) {
      console.error('[PayPal IPN] Verification request failed:', verifyError);
      return;
    }
    // ====== END SECURITY ======

    // Extract relevant fields
    const paymentStatus = params.payment_status;
    const pendingReason = params.pending_reason; // Important for held payments
    const transactionId = params.custom; // Our transaction ID
    const paypalTxnId = params.txn_id;
    const receiverEmail = params.receiver_email;
    const paymentAmount = parseFloat(params.mc_gross) || 0;
    const txnType = params.txn_type;

    console.log('[PayPal IPN] Extracted values:');
    console.log(`  payment_status: ${paymentStatus}`);
    console.log(`  pending_reason: ${pendingReason || 'N/A'}`);
    console.log(`  txn_type: ${txnType || 'N/A'}`);
    console.log(`  custom (our txn): ${transactionId}`);
    console.log(`  txn_id (paypal): ${paypalTxnId}`);
    console.log(`  mc_gross: ${paymentAmount}`);

    // Skip test/verification IPNs
    if (paypalTxnId === 'TEST123' || !paypalTxnId) {
      console.log('[PayPal IPN] Skipping test/verification IPN');
      return;
    }

    // Handle different payment statuses
    if (paymentStatus === 'Pending') {
      console.log(`[PayPal IPN] Payment is PENDING. Reason: ${pendingReason}`);
      // Log this for admin review - payment is held by PayPal
      const pool = await poolPromise;
      await pool.request()
        .input('transactionId', sql.NVarChar(100), transactionId)
        .input('pendingReason', sql.NVarChar(100), pendingReason || 'unknown')
        .query(`
          UPDATE web_donations 
          SET Status = 'paypal_pending', Notes = @pendingReason
          WHERE TransactionId = @transactionId AND Status = 'pending'
        `);
      console.log(`[PayPal IPN] Updated donation ${transactionId} to paypal_pending status`);
      return;
    }

    // Only process completed payments
    if (paymentStatus !== 'Completed') {
      console.log(`[PayPal IPN] Payment not completed: ${paymentStatus}`);
      return;
    }

    // Verify receiver email matches
    const expectedEmail = process.env.PAYPAL_EMAIL || 'pincjx771@gmail.com';
    if (receiverEmail && receiverEmail.toLowerCase() !== expectedEmail.toLowerCase()) {
      console.error(`[PayPal IPN] SECURITY: Receiver email mismatch: ${receiverEmail} vs ${expectedEmail}`);
      return;
    }

    // SECURITY: Must have valid transaction ID from custom field
    if (!transactionId || !transactionId.startsWith('NOVA-')) {
      console.error('[PayPal IPN] SECURITY: Invalid or missing transaction ID in custom field');
      return;
    }

    console.log('[PayPal IPN] Processing completed payment...');

    const pool = await poolPromise;

    // SECURITY: Only find by exact transaction ID - no amount fallback
    const donationResult = await pool.request()
      .input('transactionId', sql.NVarChar(100), transactionId)
      .query(`
        SELECT * FROM web_donations 
        WHERE TransactionId = @transactionId AND Status = 'pending'
      `);

    if (!donationResult.recordset || donationResult.recordset.length === 0) {
      console.error(`[PayPal IPN] No matching pending donation found for: ${transactionId}`);
      return;
    }

    const donation = donationResult.recordset[0];
    
    // SECURITY: Verify amount matches (with small tolerance for currency conversion)
    if (Math.abs(donation.Amount - paymentAmount) > 0.5) {
      console.error(`[PayPal IPN] SECURITY: Amount mismatch! Expected: ${donation.Amount}, Received: ${paymentAmount}`);
      return;
    }

    console.log(`[PayPal IPN] Found donation: ${donation.TransactionId}, account: ${donation.AccountId}, coins: ${donation.Coins}`);

    // SECURITY: Check for duplicate processing
    const duplicateCheck = await pool.request()
      .input('paypalTxnId', sql.NVarChar(100), paypalTxnId)
      .query(`SELECT COUNT(*) as count FROM web_donations WHERE TransactionId = @paypalTxnId AND Status = 'completed'`);
    
    if (duplicateCheck.recordset[0].count > 0) {
      console.error(`[PayPal IPN] SECURITY: Duplicate PayPal transaction ID detected: ${paypalTxnId}`);
      return;
    }

    // Update donation status
    await pool.request()
      .input('id', sql.Int, donation.Id)
      .input('paypalTxnId', sql.NVarChar(100), paypalTxnId)
      .query(`
        UPDATE web_donations 
        SET Status = 'completed', TransactionId = @paypalTxnId, CompletedAt = GETDATE()
        WHERE Id = @id AND Status IN ('pending', 'paypal_pending')
      `);

    // Credit coins DIRECTLY to Account.Coins
    await pool.request()
      .input('accountId', sql.BigInt, donation.AccountId)
      .input('coins', sql.Int, donation.Coins)
      .query(`
        UPDATE Account 
        SET Coins = ISNULL(Coins, 0) + @coins 
        WHERE AccountId = @accountId
      `);

    console.log(`[PayPal IPN] SUCCESS: Credited ${donation.Coins} coins directly to account ${donation.AccountId}`);

  } catch (error) {
    console.error('[PayPal IPN] Error processing:', error);
  }
});

// Admin endpoint to manually complete a donation
router.post('/admin/complete-donation', authMiddleware, async (req, res) => {
  try {
    const { transactionId } = req.body;
    const adminId = req.user.id;

    const pool = await poolPromise;
    const adminCheck = await pool.request()
      .input('accountId', sql.BigInt, adminId)
      .query(`SELECT Authority FROM Account WHERE AccountId = @accountId`);

    if (!adminCheck.recordset[0] || adminCheck.recordset[0].Authority < 100) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    // Find the pending donation (including paypal_pending status)
    const donationResult = await pool.request()
      .input('transactionId', sql.NVarChar(100), transactionId)
      .query(`
        SELECT * FROM web_donations 
        WHERE TransactionId = @transactionId AND Status IN ('pending', 'paypal_pending')
      `);

    if (!donationResult.recordset || donationResult.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Pending donation not found' });
    }

    const donation = donationResult.recordset[0];

    // Update donation status
    await pool.request()
      .input('transactionId', sql.NVarChar(100), transactionId)
      .query(`
        UPDATE web_donations 
        SET Status = 'completed', CompletedAt = GETDATE()
        WHERE TransactionId = @transactionId
      `);

    // Credit coins DIRECTLY to Account.Coins
    await pool.request()
      .input('accountId', sql.BigInt, donation.AccountId)
      .input('coins', sql.Int, donation.Coins)
      .query(`
        UPDATE Account 
        SET Coins = ISNULL(Coins, 0) + @coins 
        WHERE AccountId = @accountId
      `);

    console.log(`[PayPal Admin] Completed donation ${transactionId}: ${donation.Coins} coins credited directly to account ${donation.AccountId}`);

    res.json({ 
      success: true, 
      message: `Credited ${donation.Coins} coins to account ${donation.AccountId}` 
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
      .input('accountId', sql.BigInt, adminId)
      .query(`SELECT Authority FROM Account WHERE AccountId = @accountId`);

    if (!adminCheck.recordset[0] || adminCheck.recordset[0].Authority < 100) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const result = await pool.request()
      .query(`
        SELECT d.*, a.Name as AccountName
        FROM web_donations d
        LEFT JOIN Account a ON d.AccountId = a.AccountId
        WHERE d.Status = 'pending'
        ORDER BY d.CreatedAt DESC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('[PayPal Admin] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pending donations' });
  }
});

// Get ALL donations (admin only) - for admin panel
router.get('/admin/all-donations', authMiddleware, async (req, res) => {
  try {
    const adminId = req.user.id;

    const pool = await poolPromise;
    const adminCheck = await pool.request()
      .input('accountId', sql.BigInt, adminId)
      .query(`SELECT Authority FROM Account WHERE AccountId = @accountId`);

    if (!adminCheck.recordset[0] || adminCheck.recordset[0].Authority < 100) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const result = await pool.request()
      .query(`
        SELECT d.*, a.Name as AccountName
        FROM web_donations d
        LEFT JOIN Account a ON d.AccountId = a.AccountId
        ORDER BY d.CreatedAt DESC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('[PayPal Admin] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch donations' });
  }
});

// Check donation status
router.get('/donation-status/:transactionId', authMiddleware, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const accountId = req.user.id;

    const pool = await poolPromise;
    const result = await pool.request()
      .input('transactionId', sql.NVarChar(100), transactionId)
      .input('accountId', sql.BigInt, accountId)
      .query(`
        SELECT Status, Coins FROM web_donations 
        WHERE TransactionId = @transactionId AND AccountId = @accountId
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
