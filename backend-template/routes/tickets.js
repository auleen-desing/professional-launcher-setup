const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// GET /api/tickets
router.get('/', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('accountId', sql.Int, req.user.id)
      .query(`
        SELECT Id, Subject, Category, Status, CreatedAt, UpdatedAt
        FROM web_tickets 
        WHERE AccountId = @accountId
        ORDER BY CreatedAt DESC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
});

// POST /api/tickets/create
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { subject, category, message } = req.body;
    
    // SECURITY: Input validation
    if (!subject || !message) {
      return res.status(400).json({ success: false, error: 'Subject and message are required' });
    }
    
    if (subject.length > 200) {
      return res.status(400).json({ success: false, error: 'Subject too long (max 200 characters)' });
    }
    
    if (message.length > 5000) {
      return res.status(400).json({ success: false, error: 'Message too long (max 5000 characters)' });
    }
    
    // SECURITY: Sanitize HTML/scripts
    const sanitizedSubject = subject.replace(/<[^>]*>/g, '').trim();
    const sanitizedMessage = message.replace(/<script[^>]*>.*?<\/script>/gi, '').trim();
    
    const pool = await poolPromise;

    await pool.request()
      .input('accountId', sql.Int, req.user.id)
      .input('subject', sql.NVarChar, sanitizedSubject)
      .input('category', sql.VarChar, category || 'general')
      .input('message', sql.NVarChar, sanitizedMessage)
      .query(`
        INSERT INTO web_tickets (AccountId, Subject, Category, Status, Message, CreatedAt)
        VALUES (@accountId, @subject, @category, 'open', @message, GETDATE())
      `);

    res.json({ success: true, message: 'Ticket created successfully' });
  } catch (err) {
    console.error('Ticket error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/tickets/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('accountId', sql.Int, req.user.id)
      .query('SELECT * FROM web_tickets WHERE Id = @id AND AccountId = @accountId');

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/tickets/:id/reply
router.post('/:id/reply', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    const pool = await poolPromise;

    // Check if ticket belongs to user
    const ticket = await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('accountId', sql.Int, req.user.id)
      .query('SELECT * FROM web_tickets WHERE Id = @id AND AccountId = @accountId');

    if (ticket.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    // Add reply
    await pool.request()
      .input('ticketId', sql.Int, req.params.id)
      .input('accountId', sql.Int, req.user.id)
      .input('message', sql.NVarChar, message)
      .query(`
        INSERT INTO web_ticket_replies (TicketId, AccountId, Message, CreatedAt)
        VALUES (@ticketId, @accountId, @message, GETDATE())
      `);

    // Update ticket
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('UPDATE web_tickets SET UpdatedAt = GETDATE() WHERE Id = @id');

    res.json({ success: true, message: 'Reply added successfully' });
  } catch (err) {
    console.error('Reply error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/tickets/:id/close
router.post('/:id/close', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('accountId', sql.Int, req.user.id)
      .query(`
        UPDATE web_tickets 
        SET Status = 'closed', UpdatedAt = GETDATE() 
        WHERE Id = @id AND AccountId = @accountId
      `);

    res.json({ success: true, message: 'Ticket closed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
