const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Transaction, User, Donor, Festival } = require('../mongo');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken, requireRole('admin'));

// GET /api/reports/dashboard-summary
router.get('/dashboard-summary', async (req, res) => {
  try {
    const { festival_id } = req.query;

    const filter = { status: 'active' };
    if (festival_id) {
      filter.festival_id = new mongoose.Types.ObjectId(festival_id);
    } else {
      const activeFest = await Festival.findOne({ status: 'active' });
      if (activeFest) {
        filter.festival_id = activeFest._id;
      }
    }

    const totalDonors = await Donor.countDocuments();

    // Aggregation for totals & breakdowns
    const aggStats = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total_collection: { $sum: '$amount' },
          total_donations: {
            $sum: { $cond: [{ $eq: ['$receipt_type', 'donation'] }, '$amount', 0] }
          },
          total_sponsorships: {
            $sum: { $cond: [{ $eq: ['$receipt_type', 'sponsorship'] }, '$amount', 0] }
          },
          donation_count: {
            $sum: { $cond: [{ $eq: ['$receipt_type', 'donation'] }, 1, 0] }
          },
          sponsorship_count: {
            $sum: { $cond: [{ $eq: ['$receipt_type', 'sponsorship'] }, 1, 0] }
          },
          cash_total: {
            $sum: { $cond: [{ $eq: ['$payment_mode', 'cash'] }, '$amount', 0] }
          },
          upi_total: {
            $sum: { $cond: [{ $eq: ['$payment_mode', 'upi'] }, '$amount', 0] }
          },
          bank_transfer_total: {
            $sum: { $cond: [{ $eq: ['$payment_mode', 'bank_transfer'] }, '$amount', 0] }
          },
          other_total: {
            $sum: { $cond: [{ $eq: ['$payment_mode', 'other'] }, '$amount', 0] }
          }
        }
      }
    ]);

    const stats = aggStats[0] || {
      total_collection: 0,
      total_donations: 0,
      total_sponsorships: 0,
      donation_count: 0,
      sponsorship_count: 0,
      cash_total: 0,
      upi_total: 0,
      bank_transfer_total: 0,
      other_total: 0
    };

    // Today's collection
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayAgg = await Transaction.aggregate([
      {
        $match: {
          ...filter,
          transaction_date: { $gte: startOfToday }
        }
      },
      {
        $group: {
          _id: null,
          today_total: { $sum: '$amount' },
          today_count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      total_donors: totalDonors,
      total_collection: stats.total_collection,
      total_donations: stats.total_donations,
      total_sponsorships: stats.total_sponsorships,
      donation_count: stats.donation_count,
      sponsorship_count: stats.sponsorship_count,
      payment_breakdown: {
        cash: stats.cash_total,
        upi: stats.upi_total,
        bank_transfer: stats.bank_transfer_total,
        other: stats.other_total
      },
      today: {
        amount: todayAgg[0]?.today_total || 0,
        count: todayAgg[0]?.today_count || 0
      }
    });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard summary.' });
  }
});

// GET /api/reports/member-wise
router.get('/member-wise', async (req, res) => {
  try {
    const { festival_id, start_date, end_date } = req.query;
    const filter = { status: 'active' };

    if (festival_id) {
      filter.festival_id = new mongoose.Types.ObjectId(festival_id);
    }
    if (start_date || end_date) {
      filter.transaction_date = {};
      if (start_date) filter.transaction_date.$gte = new Date(start_date);
      if (end_date) {
        const ed = new Date(end_date);
        ed.setHours(23, 59, 59, 999);
        filter.transaction_date.$lte = ed;
      }
    }

    const report = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$collection_member_id',
          collected_by_name: { $first: '$collected_by_name' },
          donations_amount: {
            $sum: { $cond: [{ $eq: ['$receipt_type', 'donation'] }, '$amount', 0] }
          },
          sponsorships_amount: {
            $sum: { $cond: [{ $eq: ['$receipt_type', 'sponsorship'] }, '$amount', 0] }
          },
          total_collection: { $sum: '$amount' },
          receipts_count: { $sum: 1 },
          cash_amount: {
            $sum: { $cond: [{ $eq: ['$payment_mode', 'cash'] }, '$amount', 0] }
          },
          upi_amount: {
            $sum: { $cond: [{ $eq: ['$payment_mode', 'upi'] }, '$amount', 0] }
          },
          bank_transfer_amount: {
            $sum: { $cond: [{ $eq: ['$payment_mode', 'bank_transfer'] }, '$amount', 0] }
          },
          other_amount: {
            $sum: { $cond: [{ $eq: ['$payment_mode', 'other'] }, '$amount', 0] }
          }
        }
      },
      { $sort: { total_collection: -1 } }
    ]);

    res.json(report);
  } catch (err) {
    console.error('Member-wise report error:', err);
    res.status(500).json({ error: 'Failed to generate member-wise report.' });
  }
});

// GET /api/reports/detailed
router.get('/detailed', async (req, res) => {
  try {
    const {
      festival_id,
      member_id,
      receipt_type,
      payment_mode,
      start_date,
      end_date
    } = req.query;

    const filter = { status: 'active' };

    if (festival_id) filter.festival_id = festival_id;
    if (member_id) filter.collection_member_id = member_id;
    if (receipt_type) filter.receipt_type = receipt_type;
    if (payment_mode) filter.payment_mode = payment_mode.toLowerCase();

    if (start_date || end_date) {
      filter.transaction_date = {};
      if (start_date) filter.transaction_date.$gte = new Date(start_date);
      if (end_date) {
        const ed = new Date(end_date);
        ed.setHours(23, 59, 59, 999);
        filter.transaction_date.$lte = ed;
      }
    }

    const transactions = await Transaction.find(filter)
      .populate('donor_id', 'name mobile')
      .populate('collection_member_id', 'name')
      .populate('festival_id', 'name year')
      .sort({ transaction_date: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate detailed report.' });
  }
});

// GET /api/reports/export-csv
router.get('/export-csv', async (req, res) => {
  try {
    const { festival_id, member_id, receipt_type, payment_mode } = req.query;
    const filter = { status: 'active' };

    if (festival_id) filter.festival_id = festival_id;
    if (member_id) filter.collection_member_id = member_id;
    if (receipt_type) filter.receipt_type = receipt_type;
    if (payment_mode) filter.payment_mode = payment_mode.toLowerCase();

    const transactions = await Transaction.find(filter)
      .populate('donor_id', 'name mobile')
      .populate('collection_member_id', 'name')
      .sort({ transaction_date: -1 });

    let csv = 'Receipt No,Date,Donor Name,Mobile,Type,Amount,Payment Mode,Transaction ID,Collected By\n';

    transactions.forEach(t => {
      const dateStr = t.transaction_date ? new Date(t.transaction_date).toLocaleDateString() : '';
      const donorName = t.donor_id ? `"${t.donor_id.name.replace(/"/g, '""')}"` : '';
      const mobile = t.donor_id ? t.donor_id.mobile : '';
      const collector = t.collected_by_name ? `"${t.collected_by_name.replace(/"/g, '""')}"` : '';

      csv += `${t.receipt_number},${dateStr},${donorName},${mobile},${t.receipt_type.toUpperCase()},${t.amount},${t.payment_mode.toUpperCase()},"${t.payment_transaction_id || ''}",${collector}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=collections_report_${Date.now()}.csv`);
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ error: 'CSV export failed.' });
  }
});

module.exports = router;
