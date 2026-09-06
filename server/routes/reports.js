const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/reports/dashboard (Admin Dashboard Stats)
router.get('/dashboard', authenticateToken, requireAdmin, (req, res) => {
  // Total Unique Donors
  const uniqueDonors = db.prepare('SELECT COUNT(*) AS count FROM donors').get().count;

  // Total Donations Count & Sum
  const donationStats = db.prepare(`
    SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total
    FROM transactions WHERE receipt_type = 'donation'
  `).get();

  // Total Sponsorships Count
  const sponsorshipStats = db.prepare(`
    SELECT COUNT(*) AS count FROM transactions WHERE receipt_type = 'sponsorship'
  `).get();

  // Overall Total Collection
  const totalCollection = donationStats.total;

  // Today's Collection
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCollection = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM transactions WHERE transaction_date = ? AND receipt_type = 'donation'
  `).get(todayStr).total;

  // This Week's Collection (last 7 days)
  const weekCollection = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM transactions WHERE transaction_date >= DATE('now', '-7 days') AND receipt_type = 'donation'
  `).get().total;

  // This Month's Collection (last 30 days)
  const monthCollection = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM transactions WHERE transaction_date >= DATE('now', 'start of month') AND receipt_type = 'donation'
  `).get().total;

  // Recent 10 transactions
  const recentTransactions = db.prepare(`
    SELECT t.*, d.name AS donor_name, d.mobile AS donor_mobile,
    rd.status AS whatsapp_status
    FROM transactions t
    JOIN donors d ON t.donor_id = d.id
    LEFT JOIN receipt_delivery rd ON t.id = rd.transaction_id
    ORDER BY t.created_at DESC LIMIT 10
  `).all();

  res.json({
    metrics: {
      uniqueDonors,
      totalDonationsCount: donationStats.count,
      totalDonationsAmount: donationStats.total,
      totalSponsorshipsCount: sponsorshipStats.count,
      totalCollection,
      todayCollection,
      weekCollection,
      monthCollection
    },
    recentTransactions
  });
});

// GET /api/reports/member-summary (Member-Wise Report)
// Member Name | Donations | Sponsorships | Total Collection
router.get('/member-summary', authenticateToken, requireAdmin, (req, res) => {
  const members = db.prepare(`
    SELECT u.id, u.name AS member_name, u.username, u.status,
    COUNT(CASE WHEN t.receipt_type = 'donation' THEN 1 END) AS donations_count,
    COUNT(CASE WHEN t.receipt_type = 'sponsorship' THEN 1 END) AS sponsorships_count,
    COALESCE(SUM(CASE WHEN t.receipt_type = 'donation' THEN t.amount ELSE 0 END), 0) AS total_collection
    FROM users u
    LEFT JOIN transactions t ON u.id = t.collection_member_id
    GROUP BY u.id
    ORDER BY total_collection DESC
  `).all();

  res.json(members);
});

// GET /api/reports/export (Filter & Export CSV)
router.get('/export', authenticateToken, requireAdmin, (req, res) => {
  const { date_from, date_to, receipt_type, payment_mode, member_id } = req.query;

  let query = `
    SELECT t.receipt_number, d.name AS donor_name, d.mobile AS donor_mobile,
    t.receipt_type, t.amount, t.sponsorship_details, t.payment_mode,
    t.transaction_id, t.collected_by, t.transaction_date, rd.status AS whatsapp_status
    FROM transactions t
    JOIN donors d ON t.donor_id = d.id
    LEFT JOIN receipt_delivery rd ON t.id = rd.transaction_id
    WHERE 1=1
  `;
  const params = [];

  if (date_from) {
    query += ` AND t.transaction_date >= ?`;
    params.push(date_from);
  }
  if (date_to) {
    query += ` AND t.transaction_date <= ?`;
    params.push(date_to);
  }
  if (receipt_type) {
    query += ` AND t.receipt_type = ?`;
    params.push(receipt_type);
  }
  if (payment_mode) {
    query += ` AND t.payment_mode = ?`;
    params.push(payment_mode);
  }
  if (member_id) {
    query += ` AND t.collection_member_id = ?`;
    params.push(member_id);
  }

  query += ` ORDER BY t.created_at DESC`;

  const rows = db.prepare(query).all(...params);

  // Generate CSV Header & Lines
  const headers = ['Receipt No', 'Donor Name', 'Mobile', 'Receipt Type', 'Amount (INR)', 'Sponsorship Details', 'Payment Mode', 'Transaction ID', 'Collected By', 'Date', 'WhatsApp Status'];
  
  const csvLines = [headers.join(',')];

  rows.forEach(r => {
    const line = [
      `"${r.receipt_number}"`,
      `"${r.donor_name.replace(/"/g, '""')}"`,
      `"${r.donor_mobile}"`,
      `"${r.receipt_type}"`,
      r.amount || 0,
      `"${(r.sponsorship_details || '').replace(/"/g, '""')}"`,
      `"${r.payment_mode}"`,
      `"${r.transaction_id || ''}"`,
      `"${r.collected_by.replace(/"/g, '""')}"`,
      `"${r.transaction_date}"`,
      `"${r.whatsapp_status || 'Pending'}"`
    ];
    csvLines.push(line.join(','));
  });

  const csvContent = csvLines.join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="vinayaka_collection_report_${Date.now()}.csv"`);
  res.status(200).send(csvContent);
});

module.exports = router;
