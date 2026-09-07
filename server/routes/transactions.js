const express = require('express');
const router = express.Router();
const {
  Transaction,
  Donor,
  Festival,
  ReceiptCounter,
  ReceiptTemplate,
  ReceiptDelivery,
  CommitteeSettings,
  AuditLog
} = require('../mongo');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

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

// Convert amount in numbers to Indian Rupees words
function numberToIndianWords(num) {
  if (num === null || num === undefined || isNaN(num)) return '';
  const n = Math.floor(Number(num));
  if (n === 0) return 'Zero Rupees Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(number) {
    if (number < 20) return a[number];
    if (number < 100) return b[Math.floor(number / 10)] + (number % 10 ? ' ' + a[number % 10] : '');
    if (number < 1000) return a[Math.floor(number / 100)] + ' Hundred' + (number % 100 ? ' ' + inWords(number % 100) : '');
    if (number < 100000) return inWords(Math.floor(number / 1000)) + ' Thousand' + (number % 1000 ? ' ' + inWords(number % 1000) : '');
    if (number < 10000000) return inWords(Math.floor(number / 100000)) + ' Lakh' + (number % 100000 ? ' ' + inWords(number % 100000) : '');
    return inWords(Math.floor(number / 10000000)) + ' Crore' + (number % 10000000 ? ' ' + inWords(number % 10000000) : '');
  }

  return `${inWords(n)} Rupees Only`;
}

router.use(authenticateToken);

// POST /api/transactions (Create Collection)
router.post('/', async (req, res) => {
  try {
    const {
      donor_name,
      mobile,
      receipt_type,
      amount,
      sponsorship_category,
      sponsorship_details,
      payment_mode,
      payment_transaction_id,
      festival_id
    } = req.body;

    if (!donor_name || !mobile || !receipt_type) {
      return res.status(400).json({ error: 'Donor name, mobile number, and receipt type are required.' });
    }

    const numAmount = Number(amount) || 0;
    if (numAmount <= 0) {
      return res.status(400).json({ error: 'Collection amount must be greater than zero.' });
    }

    const normMobile = normalizeMobile(mobile);
    if (!normMobile || normMobile.length < 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
    }

    // 1. Identify or Create Festival
    let festId = festival_id;
    if (!festId) {
      const activeFest = await Festival.findOne({ status: 'active' });
      if (!activeFest) {
        return res.status(400).json({ error: 'No active festival found. Please contact admin to activate a festival.' });
      }
      festId = activeFest._id;
    }

    // 2. Identify or Create Donor
    let donor = await Donor.findOne({ normalized_mobile: normMobile });
    if (!donor) {
      donor = await Donor.create({
        name: donor_name.trim(),
        mobile: mobile.trim(),
        normalized_mobile: normMobile,
        whatsapp_number: mobile.trim(),
        total_donation_amount: receipt_type === 'donation' ? numAmount : 0,
        total_sponsorship_amount: receipt_type === 'sponsorship' ? numAmount : 0,
        total_collection_amount: numAmount,
        donation_count: receipt_type === 'donation' ? 1 : 0,
        sponsorship_count: receipt_type === 'sponsorship' ? 1 : 0
      });
    } else {
      donor.name = donor_name.trim(); // update name if changed
      donor.total_collection_amount += numAmount;
      if (receipt_type === 'donation') {
        donor.total_donation_amount += numAmount;
        donor.donation_count += 1;
      } else {
        donor.total_sponsorship_amount += numAmount;
        donor.sponsorship_count += 1;
      }
      await donor.save();
    }

    // 3. Get Committee Settings for prefix configuration
    let settings = await CommitteeSettings.findOne();
    if (!settings) {
      settings = await CommitteeSettings.create({});
    }

    const config = settings.receipt_number_config || {};
    let prefix = config.common_prefix || 'VC-';
    if (receipt_type === 'donation' && config.donation_prefix) {
      prefix = config.donation_prefix;
    } else if (receipt_type === 'sponsorship' && config.sponsorship_prefix) {
      prefix = config.sponsorship_prefix;
    }

    const paddingLength = config.padding_length || 4;
    const startNum = config.starting_number || 1;

    // 4. Concurrency-safe atomic receipt counter increment
    const counter = await ReceiptCounter.findOneAndUpdate(
      { festival_id: festId, receipt_type, prefix },
      { $inc: { current_number: 1 } },
      { upsert: true, new: true }
    );

    const receiptSeq = counter.current_number < startNum ? startNum : counter.current_number;
    if (counter.current_number < startNum) {
      await ReceiptCounter.updateOne({ _id: counter._id }, { current_number: startNum });
    }

    const seqStr = String(receiptSeq).padStart(paddingLength, '0');
    const receipt_number = `${prefix}${seqStr}`;

    // 5. Select active template
    const template = await ReceiptTemplate.findOne({ receipt_type, is_active: true });

    // 6. Create Transaction (Strictly assigning collected_by_name and collection_member_id from req.user)
    const transaction = await Transaction.create({
      festival_id: festId,
      donor_id: donor._id,
      receipt_type,
      amount: numAmount,
      amount_in_words: numberToIndianWords(numAmount),
      sponsorship_category: receipt_type === 'sponsorship' ? sponsorship_category : undefined,
      sponsorship_details: receipt_type === 'sponsorship' ? sponsorship_details : undefined,
      payment_mode: (payment_mode || 'cash').toLowerCase(),
      payment_transaction_id: payment_transaction_id || '',
      receipt_number,
      collection_member_id: req.user._id,
      collected_by_name: req.user.name,
      transaction_date: new Date(),
      receipt_template_id: template ? template._id : undefined,
      receipt_template_version: template ? template.version : 1,
      status: 'active'
    });

    // 7. Create initial WhatsApp Receipt Delivery entry
    const delivery = await ReceiptDelivery.create({
      transaction_id: transaction._id,
      whatsapp_number: donor.mobile,
      status: 'pending'
    });

    // 8. Log Audit Event
    await AuditLog.create({
      user_id: req.user._id,
      action: 'CREATE_TRANSACTION',
      entity_type: 'Transaction',
      entity_id: transaction._id,
      new_value: { receipt_number, amount: numAmount, receipt_type, donor: donor.name }
    });

    res.json({
      success: true,
      transaction: {
        _id: transaction._id,
        id: transaction._id,
        receipt_number: transaction.receipt_number,
        amount: transaction.amount,
        amount_in_words: transaction.amount_in_words,
        receipt_type: transaction.receipt_type,
        sponsorship_category: transaction.sponsorship_category,
        sponsorship_details: transaction.sponsorship_details,
        payment_mode: transaction.payment_mode,
        payment_transaction_id: transaction.payment_transaction_id,
        collected_by_name: transaction.collected_by_name,
        transaction_date: transaction.transaction_date,
        donor: {
          name: donor.name,
          mobile: donor.mobile
        },
        delivery_id: delivery._id,
        whatsapp_status: delivery.status
      }
    });
  } catch (err) {
    console.error('Create transaction error:', err);
    res.status(500).json({ error: 'Failed to create collection entry: ' + err.message });
  }
});

// GET /api/transactions (With Strict Backend Member Data Isolation)
router.get('/', async (req, res) => {
  try {
    const {
      festival_id,
      member_id,
      receipt_type,
      payment_mode,
      status,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const filter = {};

    // STRICT MEMBER DATA ISOLATION ENFORCEMENT
    if (req.user.role === 'collection_member') {
      filter.collection_member_id = req.user._id;
    } else if (member_id) {
      filter.collection_member_id = member_id;
    }

    if (festival_id) {
      filter.festival_id = festival_id;
    }
    if (receipt_type) {
      filter.receipt_type = receipt_type;
    }
    if (payment_mode) {
      filter.payment_mode = payment_mode.toLowerCase();
    }
    if (status) {
      filter.status = status;
    }

    if (search) {
      const searchClean = search.trim();
      const norm = normalizeMobile(searchClean);
      const matchingDonors = await Donor.find({
        $or: [
          { name: { $regex: searchClean, $options: 'i' } },
          { mobile: { $regex: searchClean, $options: 'i' } },
          ...(norm ? [{ normalized_mobile: norm }] : [])
        ]
      }).select('_id');

      const donorIds = matchingDonors.map(d => d._id);
      filter.$or = [
        { receipt_number: { $regex: searchClean, $options: 'i' } },
        { donor_id: { $in: donorIds } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const transactions = await Transaction.find(filter)
      .populate('donor_id', 'name mobile normalized_mobile')
      .populate('festival_id', 'name year')
      .populate('collection_member_id', 'name username')
      .sort({ transaction_date: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalCount = await Transaction.countDocuments(filter);

    // Get delivery statuses
    const txIds = transactions.map(t => t._id);
    const deliveries = await ReceiptDelivery.find({ transaction_id: { $in: txIds } });
    const deliveryMap = {};
    deliveries.forEach(d => {
      deliveryMap[d.transaction_id.toString()] = d;
    });

    const items = transactions.map(t => {
      const del = deliveryMap[t._id.toString()] || {};
      return {
        _id: t._id,
        id: t._id,
        receipt_number: t.receipt_number,
        receipt_type: t.receipt_type,
        amount: t.amount,
        amount_in_words: t.amount_in_words,
        sponsorship_category: t.sponsorship_category,
        sponsorship_details: t.sponsorship_details,
        payment_mode: t.payment_mode,
        payment_transaction_id: t.payment_transaction_id,
        collected_by_name: t.collected_by_name,
        collection_member_id: t.collection_member_id,
        transaction_date: t.transaction_date,
        status: t.status,
        cancellation_reason: t.cancellation_reason,
        donor: t.donor_id ? { id: t.donor_id._id, name: t.donor_id.name, mobile: t.donor_id.mobile } : null,
        festival: t.festival_id ? { id: t.festival_id._id, name: t.festival_id.name } : null,
        whatsapp_status: del.status || 'pending',
        delivery_id: del._id || null
      };
    });

    res.json({
      transactions: items,
      total: totalCount,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalCount / Number(limit))
    });
  } catch (err) {
    console.error('Fetch transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
});

// GET /api/transactions/my-summary (Member Daily & Total Collection Summary)
router.get('/my-summary', async (req, res) => {
  try {
    const memberId = req.user._id;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayStats = await Transaction.aggregate([
      {
        $match: {
          collection_member_id: memberId,
          status: 'active',
          transaction_date: { $gte: startOfToday }
        }
      },
      {
        $group: {
          _id: '$receipt_type',
          total_amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    let todayDonation = 0, todayDonationCount = 0;
    let todaySponsorship = 0, todaySponsorshipCount = 0;

    todayStats.forEach(s => {
      if (s._id === 'donation') {
        todayDonation = s.total_amount;
        todayDonationCount = s.count;
      } else if (s._id === 'sponsorship') {
        todaySponsorship = s.total_amount;
        todaySponsorshipCount = s.count;
      }
    });

    const totalStats = await Transaction.aggregate([
      {
        $match: {
          collection_member_id: memberId,
          status: 'active'
        }
      },
      {
        $group: {
          _id: null,
          total_collection: { $sum: '$amount' },
          total_receipts: { $sum: 1 }
        }
      }
    ]);

    res.json({
      today: {
        donations: todayDonation,
        donations_count: todayDonationCount,
        sponsorships: todaySponsorship,
        sponsorships_count: todaySponsorshipCount,
        total: todayDonation + todaySponsorship,
        receipts_count: todayDonationCount + todaySponsorshipCount
      },
      overall: {
        total_collection: totalStats[0]?.total_collection || 0,
        total_receipts: totalStats[0]?.total_receipts || 0
      }
    });
  } catch (err) {
    console.error('Fetch my-summary error:', err);
    res.status(500).json({ error: 'Failed to fetch summary.' });
  }
});

// GET /api/transactions/:id
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('donor_id')
      .populate('festival_id')
      .populate('collection_member_id', 'name username mobile')
      .populate('receipt_template_id');

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    // STRICT MEMBER-LEVEL ISOLATION
    if (
      req.user.role === 'collection_member' &&
      transaction.collection_member_id._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: 'Permission denied. You can only view your own receipts.' });
    }

    const delivery = await ReceiptDelivery.findOne({ transaction_id: transaction._id }).sort({ created_at: -1 });
    const settings = await CommitteeSettings.findOne() || {};

    res.json({
      transaction,
      donor: transaction.donor_id,
      festival: transaction.festival_id,
      member: transaction.collection_member_id,
      template: transaction.receipt_template_id,
      delivery,
      settings
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transaction details.' });
  }
});

// POST /api/transactions/:id/cancel (Admin Only)
router.post('/:id/cancel', requireRole('admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'Cancellation reason is required.' });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    if (transaction.status === 'cancelled') {
      return res.status(400).json({ error: 'Transaction is already cancelled.' });
    }

    transaction.status = 'cancelled';
    transaction.cancellation_reason = reason;
    transaction.cancelled_by = req.user._id;
    transaction.cancelled_at = new Date();
    await transaction.save();

    // Adjust donor statistics
    const donor = await Donor.findById(transaction.donor_id);
    if (donor) {
      donor.total_collection_amount = Math.max(0, donor.total_collection_amount - transaction.amount);
      if (transaction.receipt_type === 'donation') {
        donor.total_donation_amount = Math.max(0, donor.total_donation_amount - transaction.amount);
        donor.donation_count = Math.max(0, donor.donation_count - 1);
      } else {
        donor.total_sponsorship_amount = Math.max(0, donor.total_sponsorship_amount - transaction.amount);
        donor.sponsorship_count = Math.max(0, donor.sponsorship_count - 1);
      }
      await donor.save();
    }

    await AuditLog.create({
      user_id: req.user._id,
      action: 'CANCEL_TRANSACTION',
      entity_type: 'Transaction',
      entity_id: transaction._id,
      reason,
      old_value: { status: 'active' },
      new_value: { status: 'cancelled', reason }
    });

    res.json({ message: 'Transaction cancelled successfully.', transaction });
  } catch (err) {
    console.error('Cancel transaction error:', err);
    res.status(500).json({ error: 'Failed to cancel transaction.' });
  }
});

module.exports = router;
