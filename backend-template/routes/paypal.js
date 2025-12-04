const express = require('express');
const router = express.Router();
const sql = require('mssql');
const crypto = require('crypto');
const https = require('https');
const authMiddleware = require('../middleware/auth');

// Create pending donation record
router.post('/create-donation', authMiddleware, async (req, res) => {
  try {
    const { packageId, coins, amount } = req.body;
    const accountId = req.user.accountId;

    if (!packageId || !coins || !amount) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Generate unique transaction ID
    const transactionId = `NOVA-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const pool = await sql.connect();
    
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
  console.log('[PayPal IPN] Received notification:', req.body);

  // Immediately respond to PayPal
  res.status(200).send('OK');

  try {
    const params = req.body;

    // Verify IPN with PayPal
    const verifyBody = 'cmd=_notify-validate&' + new URLSearchParams(params).toString();
    
    const verified = await verifyWithPayPal(verifyBody);
    
    if (!verified) {
      console.error('[PayPal IPN] Verification failed');
      return;
    }

    console.log('[PayPal IPN] Verified successfully');

    // Extract relevant fields
    const paymentStatus = params.payment_status;
    const transactionId = params.custom; // Our transaction ID
    const paypalTxnId = params.txn_id;
    const receiverEmail = params.receiver_email;
    const paymentAmount = parseFloat(params.mc_gross);
    const paymentCurrency = params.mc_currency;

    // Verify receiver email matches
    const expectedEmail = process.env.PAYPAL_EMAIL || 'novaeranostale@gmail.com';
    if (receiverEmail.toLowerCase() !== expectedEmail.toLowerCase()) {
      console.error(`[PayPal IPN] Receiver email mismatch: ${receiverEmail} vs ${expectedEmail}`);
      return;
    }

    // Only process completed payments
    if (paymentStatus !== 'Completed') {
      console.log(`[PayPal IPN] Payment status: ${paymentStatus} - not processing`);
      return;
    }

    const pool = await sql.connect();

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
    const options = {
      hostname: process.env.PAYPAL_MODE === 'live' ? 'ipnpb.paypal.com' : 'ipnpb.sandbox.paypal.com',
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
    const accountId = req.user.accountId;

    const pool = await sql.connect();
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
