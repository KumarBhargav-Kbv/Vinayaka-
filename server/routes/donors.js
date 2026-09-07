const express = require('express');
const router = express.Router();
const { Donor, Transaction } = require('../mongo');
const { authenticateToken } = require('../middleware/authMiddleware');

function normalizeMobile(mobileStr) {
  if (!mobileStr) return '';
  let cleaned = mobileStr.replace(/\D/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
}

router.use(authenticateToken);

// GET /api/donors/search?mobile=...
router.get('/search', async (req, res) => {
  try {
    const { mobile } = req.query;
    if (!mobile) {
      return res.json(null);
    }

    const norm = normalizeMobile(mobile);
    if (!norm) {
      return res.json(null);
    }

    const donor = await Donor.findOne({ normalized_mobile: norm });
    if (!donor) {
      return res.json(null);
    }

    // Strict access control: Collection members get necessary identification info, but not full history across all members
    if (req.user.role === 'collection_member') {
      return res.json({
        _id: donor._id,
        id: donor._id,
        name: donor.name,
        mobile: donor.mobile,
        normalized_mobile: donor.normalized_mobile,
        whatsapp_number: donor.whatsapp_number,
        is_existing: true
      });
    }

    res.json(donor);
  } catch (err) {
    console.error('Search donor error:', err);
    res.status(500).json({ error: 'Donor search failed.' });
  }
});

// GET /api/donors (Admin full list / search)
router.get('/', async (req, res) => {
  try {
    const { query } = req.query;
    const filter = {};

    if (query) {
      const cleanQuery = query.trim();
      const norm = normalizeMobile(cleanQuery);
      filter.$or = [
        { name: { $regex: cleanQuery, $options: 'i' } },
        { mobile: { $regex: cleanQuery, $options: 'i' } }
      ];
      if (norm) {
        filter.$or.push({ normalized_mobile: norm });
      }
    }

    if (req.user.role === 'collection_member') {
      // Collection members see minimal list
      const donors = await Donor.find(filter).limit(20).select('name mobile normalized_mobile');
      return res.json(donors);
    }

    const donors = await Donor.find(filter).sort({ updated_at: -1 }).limit(100);
    res.json(donors);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch donors.' });
  }
});

// GET /api/donors/:id
router.get('/:id', async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found.' });
    }

    const txFilter = { donor_id: donor._id, status: 'active' };
    if (req.user.role === 'collection_member') {
      // Member isolation requirement
      txFilter.collection_member_id = req.user._id;
    }

    const transactions = await Transaction.find(txFilter)
      .populate('festival_id', 'name year')
      .populate('collection_member_id', 'name')
      .sort({ transaction_date: -1 });

    res.json({
      donor,
      transactions
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch donor details.' });
  }
});

module.exports = router;
module.exports.normalizeMobile = normalizeMobile;
