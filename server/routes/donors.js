const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/donors/search?mobile=...
router.get('/search', authenticateToken, (req, res) => {
  const { mobile } = req.query;

  if (!mobile || mobile.trim().length < 4) {
    return res.json({ found: false, donor: null, history: [] });
  }

  const cleanMobile = mobile.trim();
  const donor = db.prepare('SELECT * FROM donors WHERE mobile = ?').get(cleanMobile);

  if (!donor) {
    return res.json({ found: false, donor: null, history: [] });
  }

  const history = db.prepare(`
    SELECT id, receipt_type, amount, sponsorship_details, payment_mode, receipt_number, collected_by, transaction_date, created_at
    FROM transactions
    WHERE donor_id = ?
    ORDER BY created_at DESC
  `).all(donor.id);

  const totalDonationsCount = history.filter(h => h.receipt_type === 'donation').length;
  const totalSponsorshipsCount = history.filter(h => h.receipt_type === 'sponsorship').length;
  const totalAmount = history.reduce((sum, h) => sum + (Number(h.amount) || 0), 0);

  res.json({
    found: true,
    donor: {
      ...donor,
      total_donations_count: totalDonationsCount,
      total_sponsorships_count: totalSponsorshipsCount,
      total_amount: totalAmount
    },
    history
  });
});

// GET /api/donors - list/search donors for Admin / Members
router.get('/', authenticateToken, (req, res) => {
  const { search } = req.query;
  let query = `
    SELECT d.id, d.name, d.mobile, d.created_at,
    COUNT(t.id) AS transaction_count,
    COALESCE(SUM(CASE WHEN t.receipt_type = 'donation' THEN t.amount ELSE 0 END), 0) AS total_donated,
    COUNT(CASE WHEN t.receipt_type = 'sponsorship' THEN 1 END) AS total_sponsorships
    FROM donors d
    LEFT JOIN transactions t ON d.id = t.donor_id
  `;
  const params = [];

  if (search && search.trim()) {
    query += ` WHERE d.name LIKE ? OR d.mobile LIKE ?`;
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }

  query += ` GROUP BY d.id ORDER BY d.updated_at DESC LIMIT 100`;

  const donors = db.prepare(query).all(...params);
  res.json(donors);
});

// GET /api/donors/:id - complete donor profile & history
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const donor = db.prepare('SELECT * FROM donors WHERE id = ?').get(id);

  if (!donor) {
    return res.status(404).json({ error: 'Donor not found' });
  }

  const transactions = db.prepare(`
    SELECT * FROM transactions WHERE donor_id = ? ORDER BY created_at DESC
  `).all(id);

  const totalDonations = transactions.filter(t => t.receipt_type === 'donation').reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalSponsorships = transactions.filter(t => t.receipt_type === 'sponsorship').length;

  res.json({
    donor,
    summary: {
      total_donations: totalDonations,
      total_sponsorships: totalSponsorships,
      total_transactions: transactions.length
    },
    transactions
  });
});

module.exports = router;
