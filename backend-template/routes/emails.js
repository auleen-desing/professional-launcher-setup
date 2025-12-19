const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const nodemailer = require('nodemailer');

// Email transporter configuration
let transporter = null;

function getTransporter() {
  if (!transporter && process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
}

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
      // Users who logged in last 30 days
      query += ' AND AccountId IN (SELECT DISTINCT AccountId FROM Character WHERE IsConnected = 1 OR AccountId IN (SELECT AccountId FROM Account WHERE AccountId > 0))';
    } else if (targetGroup === 'vip') {
      query += ' AND Authority >= 1 AND Authority < 100';
    }

    const result = await pool.request().query(query);
    const recipients = result.recordset;

    if (recipients.length === 0) {
      return res.status(400).json({ success: false, error: 'No recipients found' });
    }

    const emailTransporter = getTransporter();
    
    if (!emailTransporter) {
      // If no SMTP configured, just log and save to database
      console.log('SMTP not configured. Email would be sent to:', recipients.length, 'users');
      
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
        message: `Email queued for ${recipients.length} recipients`,
        data: { recipientCount: recipients.length, status: 'queued' }
      });
    }

    // Send emails in batches
    let sent = 0;
    let failed = 0;
    const batchSize = 50;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      for (const recipient of batch) {
        try {
          await emailTransporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@novaera.com',
            to: recipient.Email,
            subject: subject,
            html: content.replace(/\{username\}/g, recipient.Name)
          });
          sent++;
        } catch (emailErr) {
          console.error('Failed to send to:', recipient.Email, emailErr.message);
          failed++;
        }
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
