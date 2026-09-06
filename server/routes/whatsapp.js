const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

// GET /api/whatsapp/logs - List all WhatsApp delivery statuses
router.get('/logs', authenticateToken, (req, res) => {
  const logs = db.prepare(`
    SELECT rd.*, t.receipt_number, t.receipt_type, t.amount, t.sponsorship_details,
    d.name AS donor_name, d.mobile AS donor_mobile
    FROM receipt_delivery rd
    JOIN transactions t ON rd.transaction_id = t.id
    JOIN donors d ON t.donor_id = d.id
    ORDER BY rd.id DESC LIMIT 100
  `).all();

  res.json(logs);
});

// PUT /api/whatsapp/status/:transactionId - Update delivery status (e.g. Sent, Delivered, Failed)
router.put('/status/:transactionId', authenticateToken, (req, res) => {
  const { transactionId } = req.params;
  const { status, failure_reason } = req.body;

  if (!['Pending', 'Sent', 'Delivered', 'Failed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid WhatsApp status' });
  }

  const existing = db.prepare('SELECT * FROM receipt_delivery WHERE transaction_id = ?').get(transactionId);
  
  const now = new Date().toISOString();
  let sentAt = existing ? existing.sent_at : null;
  let deliveredAt = existing ? existing.delivered_at : null;

  if (status === 'Sent' || status === 'Delivered') {
    if (!sentAt) sentAt = now;
  }
  if (status === 'Delivered') {
    deliveredAt = now;
  }

  if (existing) {
    db.prepare(`
      UPDATE receipt_delivery
      SET status = ?, sent_at = ?, delivered_at = ?, failure_reason = ?
      WHERE transaction_id = ?
    `).run(status, sentAt, deliveredAt, failure_reason || null, transactionId);
  } else {
    const txn = db.prepare('SELECT donor_id FROM transactions WHERE id = ?').get(transactionId);
    const donor = txn ? db.prepare('SELECT mobile FROM donors WHERE id = ?').get(txn.donor_id) : null;
    const mobile = donor ? donor.mobile : '';

    db.prepare(`
      INSERT INTO receipt_delivery (transaction_id, whatsapp_number, status, sent_at, delivered_at, failure_reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(transactionId, mobile, status, sentAt, deliveredAt, failure_reason || null);
  }

  logAudit(db, req.user.id, transactionId, 'UPDATE_WHATSAPP_STATUS', existing, { status, failure_reason });

  res.json({ message: 'WhatsApp delivery status updated', status });
});

// POST /api/whatsapp/retry/:transactionId - Retry sending receipt via WhatsApp
router.post('/retry/:transactionId', authenticateToken, (req, res) => {
  const { transactionId } = req.params;

  const txn = db.prepare(`
    SELECT t.*, d.name AS donor_name, d.mobile AS donor_mobile
    FROM transactions t
    JOIN donors d ON t.donor_id = d.id
    WHERE t.id = ?
  `).get(transactionId);

  if (!txn) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const settings = db.prepare('SELECT committee_name, festival_name FROM committee_settings WHERE id = 1').get();

  // Reset status to Sent and update timestamp
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE receipt_delivery
    SET status = 'Sent', sent_at = ?, failure_reason = NULL
    WHERE transaction_id = ?
  `).run(now, transactionId);

  logAudit(db, req.user.id, transactionId, 'RETRY_WHATSAPP', null, { transactionId });

  // Format WhatsApp message text
  const amountStr = txn.receipt_type === 'donation' ? `₹${txn.amount}` : txn.sponsorship_details;
  const messageText = `*${settings ? settings.committee_name : 'Sri Vinayaka Chavithi Utsava Samithi'}*\n` +
    `*${settings ? settings.festival_name : 'Ganesh Chaturthi Utsav'}*\n\n` +
    `Dear ${txn.donor_name},\n` +
    `Thank you for your generous ${txn.receipt_type.toUpperCase()}!\n\n` +
    `*Receipt No:* ${txn.receipt_number}\n` +
    `*Details:* ${amountStr}\n` +
    `*Payment Mode:* ${txn.payment_mode}\n` +
    `*Collected By:* ${txn.collected_by}\n` +
    `*Date:* ${txn.transaction_date}\n\n` +
    `May Lord Ganesha bless you and your family! 🙏`;

  const encodedMessage = encodeURIComponent(messageText);
  const cleanMobile = txn.donor_mobile.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanMobile.length === 10 ? '91' + cleanMobile : cleanMobile}?text=${encodedMessage}`;

  res.json({
    message: 'WhatsApp retry link generated',
    waUrl,
    status: 'Sent'
  });
});

module.exports = router;
