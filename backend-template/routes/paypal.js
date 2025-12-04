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
    const accountId = req.user.id; // JWT token uses 'id' not 'accountId'

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

// PayPal IPN handler
router.post('/ipn', async (req, res) => {
  console.log('[PayPal IPN] Received notification');
  console.log('[PayPal IPN] Body:', JSON.stringify(req.body));

  // Immediately respond to PayPal
  res.status(200).send('OK');

  try {
    const params = req.body;

    // Extract relevant fields
    const paymentStatus = params.payment_status;
    const transactionId = params.custom; // Our transaction ID
    const paypalTxnId = params.txn_id;
    const receiverEmail = params.receiver_email;
    const paymentAmount = parseFloat(params.mc_gross);

    console.log('[PayPal IPN] Payment status:', paymentStatus);
    console.log('[PayPal IPN] Transaction ID:', transactionId);
    console.log('[PayPal IPN] PayPal Txn ID:', paypalTxnId);
    console.log('[PayPal IPN] Amount:', paymentAmount);

    // Verify receiver email matches
    const expectedEmail = process.env.PAYPAL_EMAIL || 'pincjx771@gmail.com';
    if (receiverEmail && receiverEmail.toLowerCase() !== expectedEmail.toLowerCase()) {
      console.error(`[PayPal IPN] Receiver email mismatch: ${receiverEmail} vs ${expectedEmail}`);
      return;
    }

    // Only process completed payments
    if (paymentStatus !== 'Completed') {
      console.log(`[PayPal IPN] Payment status: ${paymentStatus} - not processing`);
      return;
    }

    console.log('[PayPal IPN] Processing completed payment...');

    const pool = await poolPromise;

    // Find the pending donation
    const donationResult = await pool.request()
      .input('transactionId', sql.VarChar(100), transactionId)
      .query(`
        SELECT * FROM web_donations 
        WHERE transaction_id = @transactionId AND status = 'pending'
      `);

    if (!donationResult.recordset || donationResult.recordset.length === 0) {
      console.error(`[PayPal IPN] Donation not found or already processed: ${transactionId}`);
      return;
    }

    const donation = donationResult.recordset[0];

    // Verify amount matches (allow small variance for currency conversion)
    if (Math.abs(paymentAmount - donation.amount) > 1) {
      console.error(`[PayPal IPN] Amount mismatch: received ${paymentAmount}, expected ${donation.amount}`);
      return;
    }

    // Update donation status and add PayPal transaction ID
    await pool.request()
      .input('transactionId', sql.VarChar(100), transactionId)
      .input('paypalTxnId', sql.VarChar(100), paypalTxnId)
      .query(`
        UPDATE web_donations 
        SET status = 'completed', paypal_txn_id = @paypalTxnId, completed_at = GETDATE()
        WHERE transaction_id = @transactionId
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

// Verify IPN with PayPal
function verifyWithPayPal(body) {
  return new Promise((resolve) => {
    // Default to live mode - use 'sandbox' only if explicitly set
    const useSandbox = process.env.PAYPAL_MODE === 'sandbox';
    const hostname = useSandbox ? 'ipnpb.sandbox.paypal.com' : 'ipnpb.paypal.com';
    
    console.log(`[PayPal IPN] Verifying with ${hostname}`);
    
    const options = {
      hostname: hostname,
      port: 443,
      path: '/cgi-bin/webscr',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('[PayPal IPN] Verify response:', data);
        resolve(data === 'VERIFIED');
      });
    });

    req.on('error', (err) => {
      console.error('[PayPal IPN] Verify error:', err);
      resolve(false);
    });

    req.write(body);
    req.end();
  });
}

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
