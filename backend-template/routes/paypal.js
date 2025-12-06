const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const crypto = require('crypto');
const { authMiddleware } = require('../middleware/auth');

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

// Test endpoint to verify IPN URL is accessible
router.get('/ipn-test', (req, res) => {
  console.log('[PayPal IPN] Test endpoint hit');
  res.json({ success: true, message: 'IPN endpoint is accessible', timestamp: new Date() });
});

// PayPal IPN handler
router.post('/ipn', async (req, res) => {
  console.log('[PayPal IPN] ========== RECEIVED ==========');
  console.log('[PayPal IPN] Raw body:', JSON.stringify(req.body, null, 2));

  // IMPORTANT: Respond to PayPal immediately with 200
  res.status(200).send('OK');

  try {
    const params = req.body;

    // Extract relevant fields
    const paymentStatus = params.payment_status;
    const transactionId = params.custom; // Our transaction ID
    const paypalTxnId = params.txn_id;
    const receiverEmail = params.receiver_email;
    const paymentAmount = parseFloat(params.mc_gross) || 0;

    console.log('[PayPal IPN] Extracted values:');
    console.log(`  payment_status: ${paymentStatus}`);
    console.log(`  custom (our txn): ${transactionId}`);
    console.log(`  txn_id (paypal): ${paypalTxnId}`);
    console.log(`  mc_gross: ${paymentAmount}`);

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

    // Verify receiver email matches
    const expectedEmail = 'pincjx771@gmail.com';
    if (receiverEmail && receiverEmail.toLowerCase() !== expectedEmail.toLowerCase()) {
      console.error(`[PayPal IPN] Receiver email mismatch: ${receiverEmail} vs ${expectedEmail}`);
      return;
    }

    console.log('[PayPal IPN] Processing completed payment...');

    const pool = await poolPromise;

    // Find by custom field (our transaction ID)
    let donationResult = await pool.request()
      .input('transactionId', sql.NVarChar(100), transactionId || '')
      .query(`
        SELECT * FROM web_donations 
        WHERE TransactionId = @transactionId AND Status = 'pending'
      `);

    // Fallback: find by amount
    if (!donationResult.recordset || donationResult.recordset.length === 0) {
      console.log('[PayPal IPN] Not found by custom field, trying amount match...');
      
      donationResult = await pool.request()
        .input('amount', sql.Decimal(10, 2), paymentAmount)
        .query(`
          SELECT TOP 1 * FROM web_donations 
          WHERE Status = 'pending' 
          AND ABS(Amount - @amount) < 0.5
          ORDER BY CreatedAt DESC
        `);
    }

    if (!donationResult.recordset || donationResult.recordset.length === 0) {
      console.error(`[PayPal IPN] No matching pending donation found`);
      return;
    }

    const donation = donationResult.recordset[0];
    console.log(`[PayPal IPN] Found donation: ${donation.TransactionId}, account: ${donation.AccountId}, coins: ${donation.Coins}`);

    // Update donation status
    await pool.request()
      .input('id', sql.Int, donation.Id)
      .input('paypalTxnId', sql.NVarChar(100), paypalTxnId)
      .query(`
        UPDATE web_donations 
        SET Status = 'completed', TransactionId = @paypalTxnId, CompletedAt = GETDATE()
        WHERE Id = @id
      `);

    // Credit coins to account
    await pool.request()
      .input('accountId', sql.BigInt, donation.AccountId)
      .input('coins', sql.Int, donation.Coins)
      .query(`
        UPDATE Account SET Coins = ISNULL(Coins, 0) + @coins WHERE AccountId = @accountId
      `);

    console.log(`[PayPal IPN] SUCCESS: Credited ${donation.Coins} coins to account ${donation.AccountId}`);

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

    // Find the pending donation
    const donationResult = await pool.request()
      .input('transactionId', sql.NVarChar(100), transactionId)
      .query(`
        SELECT * FROM web_donations 
        WHERE TransactionId = @transactionId AND Status = 'pending'
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

    // Credit coins to account
    await pool.request()
      .input('accountId', sql.BigInt, donation.AccountId)
      .input('coins', sql.Int, donation.Coins)
      .query(`
        UPDATE Account SET Coins = ISNULL(Coins, 0) + @coins WHERE AccountId = @accountId
      `);

    console.log(`[PayPal Admin] Manually completed donation ${transactionId}: ${donation.Coins} coins to account ${donation.AccountId}`);

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
