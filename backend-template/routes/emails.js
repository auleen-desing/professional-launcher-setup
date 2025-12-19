const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { Resend } = require('resend');

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// POST /api/emails/mass-send - Send mass email to all users (Admin only)
router.post('/mass-send', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { subject, content, targetGroup } = req.body;

    if (!subject || !content) {
      return res.status(400).json({ success: false, error: 'Subject and content are required' });
    }

    const pool = await poolPromise;

    // Build query based on target group
    let query = 'SELECT Email, Name FROM Account WHERE Email IS NOT NULL AND Email != \'\'';
    
    if (targetGroup === 'active') {
      query += ' AND AccountId IN (SELECT DISTINCT AccountId FROM Character WHERE IsConnected = 1 OR AccountId IN (SELECT AccountId FROM Account WHERE AccountId > 0))';
    } else if (targetGroup === 'vip') {
      query += ' AND Authority >= 1 AND Authority < 100';
    }

    const result = await pool.request().query(query);
    const recipients = result.recordset;

    if (recipients.length === 0) {
      return res.status(400).json({ success: false, error: 'No recipients found' });
    }

    if (!resend) {
      console.log('Resend not configured. Email would be sent to:', recipients.length, 'users');
      
      // Save email to database for record
      await pool.request()
        .input('subject', sql.NVarChar, subject)
        .input('content', sql.NVarChar, content)
        .input('targetGroup', sql.VarChar, targetGroup || 'all')
        .input('recipientCount', sql.Int, recipients.length)
        .input('sentBy', sql.BigInt, req.user.id)
        .query(`
          INSERT INTO web_mass_emails (subject, content, target_group, recipient_count, sent_by, sent_at)
          VALUES (@subject, @content, @targetGroup, @recipientCount, @sentBy, GETDATE())
        `);

      return res.json({ 
        success: true, 
        message: `Email queued for ${recipients.length} recipients (Resend not configured)`,
        data: { recipientCount: recipients.length, status: 'queued' }
      });
    }

    // Send emails in batches using Resend
    let sent = 0;
    let failed = 0;
    const batchSize = 50; // Resend recommends batching

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      // Send individual emails (Resend batch API requires verified domain for each recipient)
      for (const recipient of batch) {
        try {
          // Personalize content with username
          const personalizedContent = content.replace(/\{username\}/g, recipient.Name);
          
          await resend.emails.send({
            from: 'NovaEra <noreply@novaerasite.com>',
            to: [recipient.Email],
            subject: subject,
            html: personalizedContent
          });
          sent++;
        } catch (emailErr) {
          console.error('Failed to send to:', recipient.Email, emailErr.message);
          failed++;
        }
      }

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Log the mass email
    await pool.request()
      .input('subject', sql.NVarChar, subject)
      .input('content', sql.NVarChar, content)
      .input('targetGroup', sql.VarChar, targetGroup || 'all')
      .input('recipientCount', sql.Int, sent)
      .input('sentBy', sql.BigInt, req.user.id)
      .query(`
        INSERT INTO web_mass_emails (subject, content, target_group, recipient_count, sent_by, sent_at)
        VALUES (@subject, @content, @targetGroup, @recipientCount, @sentBy, GETDATE())
      `);

    res.json({ 
      success: true, 
      message: `Email sent to ${sent} recipients (${failed} failed)`,
      data: { sent, failed }
    });
  } catch (err) {
    console.error('Mass email error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/emails/history - Get mass email history (Admin only)
router.get('/history', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT TOP 50 e.*, a.Name as sent_by_name
      FROM web_mass_emails e
      LEFT JOIN Account a ON e.sent_by = a.AccountId
      ORDER BY e.sent_at DESC
    `);

    const emails = result.recordset.map(e => ({
      id: e.id,
      subject: e.subject,
      targetGroup: e.target_group,
      recipientCount: e.recipient_count,
      sentBy: e.sent_by_name,
      sentAt: e.sent_at
    }));

    res.json({ success: true, data: emails });
  } catch (err) {
    console.error('Email history error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
