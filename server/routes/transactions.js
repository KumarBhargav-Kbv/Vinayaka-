const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { numberToWordsIndian } = require('../utils/numberToWords');
const { logAudit } = require('../utils/audit');

// POST /api/transactions - Add new collection (Collection Member or Admin)
router.post('/', authenticateToken, (req, res) => {
  const {
    donor_name,
    mobile,
    receipt_type,
    amount,
    sponsorship_details,
    payment_mode,
    transaction_id,
    transaction_date
  } = req.body;

  // Validation
  if (!donor_name || !donor_name.trim()) {
    return res.status(400).json({ error: 'Donor Name is required' });
  }

  if (!mobile || !mobile.trim()) {
    return res.status(400).json({ error: 'Mobile Number is required' });
  }

  if (!['donation', 'sponsorship'].includes(receipt_type)) {
    return res.status(400).json({ error: 'Receipt Type must be either donation or sponsorship' });
  }

  if (receipt_type === 'donation') {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Valid positive amount is required for Donation' });
    }
  }

  if (receipt_type === 'sponsorship') {
    if (!sponsorship_details || !sponsorship_details.trim()) {
      return res.status(400).json({ error: 'Sponsorship details are required' });
    }
  }

  const validPaymentModes = ['Cash', 'UPI', 'Bank Transfer', 'Other'];
  const finalPaymentMode = validPaymentModes.includes(payment_mode) ? payment_mode : 'Cash';
  const cleanMobile = mobile.trim();
  const cleanName = donor_name.trim();

  // 1. Find or create donor
  let donor = db.prepare('SELECT * FROM donors WHERE mobile = ?').get(cleanMobile);
  if (!donor) {
    const insertDonor = db.prepare('INSERT INTO donors (name, mobile) VALUES (?, ?)');
    const donorResult = insertDonor.run(cleanName, cleanMobile);
    donor = db.prepare('SELECT * FROM donors WHERE id = ?').get(donorResult.lastInsertRowid);
  } else {
    // Update name if changed
    db.prepare("UPDATE donors SET name = ?, updated_at = DATETIME('now') WHERE id = ?").run(cleanName, donor.id);
  }

  // 2. Generate unique receipt number
  const settings = db.prepare('SELECT * FROM committee_settings WHERE id = 1').get();
  const prefix = settings ? (settings.receipt_prefix || 'VC-') : 'VC-';

  const countRow = db.prepare('SELECT COUNT(*) as count FROM transactions').get();
  const nextSeq = countRow.count + 1;
  const receiptNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;

  const tDate = transaction_date ? transaction_date : new Date().toISOString().split('T')[0];

  // 3. Insert transaction with collected_by automatically recorded from req.user
  const collectedBy = req.user.name;
  const collectionMemberId = req.user.id;

  const insertTxn = db.prepare(`
    INSERT INTO transactions (
      donor_id, receipt_type, amount, sponsorship_details, payment_mode,
      transaction_id, receipt_number, collection_member_id, collected_by, transaction_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const txnResult = insertTxn.run(
    donor.id,
    receipt_type,
    receipt_type === 'donation' ? Number(amount) : 0,
    receipt_type === 'sponsorship' ? sponsorship_details.trim() : null,
    finalPaymentMode,
    transaction_id ? transaction_id.trim() : '',
    receiptNumber,
    collectionMemberId,
    collectedBy,
    tDate
  );

  const txnId = txnResult.lastInsertRowid;

  // 4. Create initial WhatsApp delivery log
  db.prepare(`
    INSERT INTO receipt_delivery (transaction_id, whatsapp_number, status)
    VALUES (?, ?, 'Pending')
  `).run(txnId, cleanMobile);

  // 5. Audit log
  logAudit(db, req.user.id, txnId, 'CREATE_COLLECTION', null, {
    receiptNumber,
    receipt_type,
    collectedBy,
    amount: receipt_type === 'donation' ? amount : sponsorship_details
  });

  // 6. Sync to MongoDB Atlas if configured
  try {
    const { Donor: MongoDonor, Transaction: MongoTransaction, ReceiptDelivery: MongoDelivery } = require('../mongo');
    (async () => {
      let mDonor = await MongoDonor.findOne({ mobile: cleanMobile });
      if (!mDonor) {
        mDonor = await MongoDonor.create({ name: cleanName, mobile: cleanMobile });
      } else {
        await MongoDonor.updateOne({ mobile: cleanMobile }, { name: cleanName, updated_at: new Date() });
      }

      const mTxn = await MongoTransaction.create({
        donor_id: mDonor._id,
        receipt_type,
        amount: receipt_type === 'donation' ? Number(amount) : 0,
        sponsorship_details: receipt_type === 'sponsorship' ? sponsorshipDetails.trim() : null,
        payment_mode: finalPaymentMode,
        transaction_id: transaction_id ? transaction_id.trim() : '',
        receipt_number: receiptNumber,
        collected_by: collectedBy,
        transaction_date: tDate
      });

      await MongoDelivery.create({
        transaction_id: mTxn._id,
        whatsapp_number: cleanMobile,
        status: 'Pending'
      });
    })();
  } catch (err) {
    console.error('[MongoDB Sync Notice]:', err.message);
  }

  // 7. Fetch complete transaction for response
  const txn = db.prepare(`
    SELECT t.*, d.name AS donor_name, d.mobile AS donor_mobile
    FROM transactions t
    JOIN donors d ON t.donor_id = d.id
    WHERE t.id = ?
  `).get(txnId);

  // Convert amount to words if donation
  const amountWords = txn.receipt_type === 'donation' ? numberToWordsIndian(txn.amount) : '';

  // Fetch corresponding template
  const templateRow = db.prepare('SELECT template_data FROM receipt_templates WHERE receipt_type = ?').get(receipt_type);
  const template = templateRow ? JSON.parse(templateRow.template_data) : null;

  res.status(201).json({
    transaction: txn,
    amount_words: amountWords,
    settings,
    template
  });
});

// GET /api/transactions - Get list of transactions (Filtered)
router.get('/', authenticateToken, (req, res) => {
  const { member_id, receipt_type, payment_mode, date_from, date_to, search } = req.query;

  let query = `
    SELECT t.*, d.name AS donor_name, d.mobile AS donor_mobile,
    rd.status AS whatsapp_status, rd.sent_at AS whatsapp_sent_at
    FROM transactions t
    JOIN donors d ON t.donor_id = d.id
    LEFT JOIN receipt_delivery rd ON t.id = rd.transaction_id
    WHERE 1=1
  `;
  const params = [];

  // Non-admins can only see their own collections unless specifically permitted
  if (req.user.role === 'MEMBER') {
    query += ` AND t.collection_member_id = ?`;
    params.push(req.user.id);
  } else if (member_id) {
    query += ` AND t.collection_member_id = ?`;
    params.push(member_id);
  }

  if (receipt_type) {
    query += ` AND t.receipt_type = ?`;
    params.push(receipt_type);
  }

  if (payment_mode) {
    query += ` AND t.payment_mode = ?`;
    params.push(payment_mode);
  }

  if (date_from) {
    query += ` AND t.transaction_date >= ?`;
    params.push(date_from);
  }

  if (date_to) {
    query += ` AND t.transaction_date <= ?`;
    params.push(date_to);
  }

  if (search && search.trim()) {
    query += ` AND (d.name LIKE ? OR d.mobile LIKE ? OR t.receipt_number LIKE ?)`;
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  query += ` ORDER BY t.created_at DESC LIMIT 200`;

  const rows = db.prepare(query).all(...params);

  // Attach amount in words for donations
  const result = rows.map(r => ({
    ...r,
    amount_words: r.receipt_type === 'donation' ? numberToWordsIndian(r.amount) : ''
  }));

  res.json(result);
});

// GET /api/transactions/:id - Fetch single transaction with settings & template
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  const txn = db.prepare(`
    SELECT t.*, d.name AS donor_name, d.mobile AS donor_mobile,
    rd.status AS whatsapp_status, rd.sent_at AS whatsapp_sent_at, rd.failure_reason
    FROM transactions t
    JOIN donors d ON t.donor_id = d.id
    LEFT JOIN receipt_delivery rd ON t.id = rd.transaction_id
    WHERE t.id = ?
  `).get(id);

  if (!txn) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const settings = db.prepare('SELECT * FROM committee_settings WHERE id = 1').get();
  const templateRow = db.prepare('SELECT template_data FROM receipt_templates WHERE receipt_type = ?').get(txn.receipt_type);
  const template = templateRow ? JSON.parse(templateRow.template_data) : null;
  const amountWords = txn.receipt_type === 'donation' ? numberToWordsIndian(txn.amount) : '';

  res.json({
    transaction: txn,
    amount_words: amountWords,
    settings,
    template
  });
});

// PUT /api/transactions/:id - Admin Edit Transaction
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { donor_name, amount, sponsorship_details, payment_mode, transaction_id } = req.body;

  const existing = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  if (donor_name && donor_name.trim()) {
    db.prepare('UPDATE donors SET name = ? WHERE id = ?').run(donor_name.trim(), existing.donor_id);
  }

  const newAmount = existing.receipt_type === 'donation' && amount !== undefined ? Number(amount) : existing.amount;
  const newSpon = existing.receipt_type === 'sponsorship' && sponsorship_details !== undefined ? sponsorship_details.trim() : existing.sponsorship_details;
  const newPayMode = payment_mode || existing.payment_mode;
  const newTxnId = transaction_id !== undefined ? transaction_id.trim() : existing.transaction_id;

  db.prepare(`
    UPDATE transactions
    SET amount = ?, sponsorship_details = ?, payment_mode = ?, transaction_id = ?, updated_at = DATETIME('now')
    WHERE id = ?
  `).run(newAmount, newSpon, newPayMode, newTxnId, id);

  logAudit(db, req.user.id, id, 'EDIT_TRANSACTION', existing, { amount: newAmount, sponsorship_details: newSpon, payment_mode: newPayMode });

  res.json({ message: 'Transaction updated successfully' });
});

module.exports = router;
