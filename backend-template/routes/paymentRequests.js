const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { logTransaction } = require('./transactions');

// Submit a payment request (Paysafecard)
router.post('/submit', authMiddleware, async (req, res) => {
    try {
        const { paymentType, code, amount, coinsRequested } = req.body;
        const accountId = req.user.id;

        if (!paymentType || !code || !amount || !coinsRequested) {
            return res.status(400).json({ success: false, error: 'All fields are required' });
        }

        const validTypes = ['paysafecard'];
        if (!validTypes.includes(paymentType)) {
            return res.status(400).json({ success: false, error: 'Invalid payment type' });
        }

        if (amount <= 0 || coinsRequested <= 0) {
            return res.status(400).json({ success: false, error: 'Amount and coins must be positive' });
        }

        const pool = await getPool();

        // Check for duplicate pending requests with same code
        const existingRequest = await pool.request()
            .input('code', code)
            .input('paymentType', paymentType)
            .query(`
                SELECT id FROM web_payment_requests 
                WHERE code = @code AND payment_type = @paymentType AND status = 'pending'
            `);

        if (existingRequest.recordset.length > 0) {
            return res.status(400).json({ success: false, error: 'This code has already been submitted and is pending review' });
        }

        await pool.request()
            .input('accountId', accountId)
            .input('paymentType', paymentType)
            .input('code', code)
            .input('amount', amount)
            .input('coinsRequested', coinsRequested)
            .query(`
                INSERT INTO web_payment_requests (account_id, payment_type, code, amount, coins_requested)
                VALUES (@accountId, @paymentType, @code, @amount, @coinsRequested)
            `);

        res.json({ success: true, message: 'Payment request submitted successfully. It will be reviewed shortly.' });
    } catch (error) {
        console.error('Submit payment request error:', error);
        res.status(500).json({ success: false, error: 'Failed to submit payment request' });
    }
});

// Get user's payment requests
router.get('/my-requests', authMiddleware, async (req, res) => {
    try {
        const accountId = req.user.id;
        const pool = await getPool();

        const result = await pool.request()
            .input('accountId', accountId)
            .query(`
                SELECT id, payment_type, code, amount, coins_requested, status, admin_notes, created_at, processed_at
                FROM web_payment_requests
                WHERE account_id = @accountId
                ORDER BY created_at DESC
            `);

        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Get payment requests error:', error);
        res.status(500).json({ success: false, error: 'Failed to get payment requests' });
    }
});

// ADMIN: Get all pending payment requests
router.get('/admin/pending', authMiddleware, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const pool = await getPool();
        const result = await pool.request()
            .query(`
                SELECT pr.*, a.AccountName as username
                FROM web_payment_requests pr
                JOIN Account a ON pr.account_id = a.AccountId
                WHERE pr.status = 'pending'
                ORDER BY pr.created_at ASC
            `);

        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Get pending requests error:', error);
        res.status(500).json({ success: false, error: 'Failed to get pending requests' });
    }
});

// ADMIN: Get all payment requests with pagination
router.get('/admin/all', authMiddleware, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status || 'all';
        const offset = (page - 1) * limit;

        const allowedStatuses = ['all', 'pending', 'approved', 'rejected'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status filter' });
        }

        const pool = await getPool();
        
        const whereClause = status === 'all' ? '' : 'WHERE pr.status = @status';

        const countReq = pool.request();
        if (status !== 'all') countReq.input('status', status);
        const countResult = await countReq.query(
            `SELECT COUNT(*) as total FROM web_payment_requests pr ${whereClause}`
        );

        const dataReq = pool.request().input('offset', offset).input('limit', limit);
        if (status !== 'all') dataReq.input('status', status);

        const result = await dataReq.query(`
                SELECT pr.*, a.AccountName as username,
                       admin.AccountName as processed_by_name
                FROM web_payment_requests pr
                JOIN Account a ON pr.account_id = a.AccountId
                LEFT JOIN Account admin ON pr.processed_by = admin.AccountId
                ${whereClause}
                ORDER BY pr.created_at DESC
                OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
            `);

        res.json({ 
            success: true, 
            data: result.recordset,
            pagination: {
                page,
                limit,
                total: countResult.recordset[0].total,
                totalPages: Math.ceil(countResult.recordset[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Get all requests error:', error);
        res.status(500).json({ success: false, error: 'Failed to get requests' });
    }
});

// ADMIN: Process payment request (approve/reject)
router.post('/admin/process/:id', authMiddleware, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const { id } = req.params;
        const { action, adminNotes, coinsToGive } = req.body;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, error: 'Invalid action' });
        }

        const pool = await getPool();

        // Get the request
        const requestResult = await pool.request()
            .input('id', id)
            .query(`
                SELECT pr.*, a.AccountName as username
                FROM web_payment_requests pr
                JOIN Account a ON pr.account_id = a.AccountId
                WHERE pr.id = @id AND pr.status = 'pending'
            `);

        if (requestResult.recordset.length === 0) {
            return res.status(404).json({ success: false, error: 'Request not found or already processed' });
        }

        const request = requestResult.recordset[0];
        const status = action === 'approve' ? 'approved' : 'rejected';

        // Update the request
        await pool.request()
            .input('id', id)
            .input('status', status)
            .input('adminNotes', adminNotes || null)
            .input('processedBy', req.user.id)
            .query(`
                UPDATE web_payment_requests 
                SET status = @status, admin_notes = @adminNotes, processed_by = @processedBy, processed_at = GETDATE()
                WHERE id = @id
            `);

        // If approved, add coins to user
        if (action === 'approve') {
            const coins = coinsToGive || request.coins_requested;
            
            await pool.request()
                .input('accountId', request.account_id)
                .input('coins', coins)
                .query(`UPDATE Account SET WebCoins = ISNULL(WebCoins, 0) + @coins WHERE AccountId = @accountId`);

            // Log the transaction
            await logTransaction(
                pool,
                request.account_id,
                'paysafecard',
                coins,
                `PAYSAFECARD - €${request.amount}`,
                request.code
            );
        }

        res.json({ 
            success: true, 
            message: action === 'approve' 
                ? `Request approved. ${coinsToGive || request.coins_requested} coins added to ${request.username}`
                : 'Request rejected'
        });
    } catch (error) {
        console.error('Process request error:', error);
        res.status(500).json({ success: false, error: 'Failed to process request' });
    }
});

module.exports = router;
