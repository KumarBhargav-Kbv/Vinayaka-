const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User, Transaction, AuditLog } = require('../mongo');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken, requireRole('admin'));

// GET /api/members
router.get('/', async (req, res) => {
  try {
    const members = await User.find({ role: 'collection_member' }).sort({ created_at: -1 });

    // Aggregate statistics per member
    const memberStats = await Transaction.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$collection_member_id',
          total_donation_amount: {
            $sum: { $cond: [{ $eq: ['$receipt_type', 'donation'] }, '$amount', 0] }
          },
          total_sponsorship_amount: {
            $sum: { $cond: [{ $eq: ['$receipt_type', 'sponsorship'] }, '$amount', 0] }
          },
          total_amount: { $sum: '$amount' },
          donation_count: {
            $sum: { $cond: [{ $eq: ['$receipt_type', 'donation'] }, 1, 0] }
          },
          sponsorship_count: {
            $sum: { $cond: [{ $eq: ['$receipt_type', 'sponsorship'] }, 1, 0] }
          },
          receipts_count: { $sum: 1 }
        }
      }
    ]);

    const statsMap = {};
    memberStats.forEach(stat => {
      statsMap[stat._id.toString()] = stat;
    });

    const result = members.map(m => {
      const stat = statsMap[m._id.toString()] || {};
      return {
        _id: m._id,
        id: m._id,
        name: m.name,
        username: m.username,
        mobile: m.mobile,
        status: m.status,
        last_login_at: m.last_login_at,
        created_at: m.created_at,
        total_donation_amount: stat.total_donation_amount || 0,
        total_sponsorship_amount: stat.total_sponsorship_amount || 0,
        total_amount: stat.total_amount || 0,
        donation_count: stat.donation_count || 0,
        sponsorship_count: stat.sponsorship_count || 0,
        receipts_count: stat.receipts_count || 0
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Fetch members error:', err);
    res.status(500).json({ error: 'Failed to fetch members.' });
  }
});

// POST /api/members
router.post('/', async (req, res) => {
  try {
    const { name, username, password, mobile } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({ error: 'Name, username, and password are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(400).json({ error: 'Username already exists.' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const newMember = await User.create({
      name: name.trim(),
      username: cleanUsername,
      password_hash,
      role: 'collection_member',
      mobile: mobile ? mobile.trim() : '',
      status: 'active'
    });

    await AuditLog.create({
      user_id: req.user._id,
      action: 'CREATE_COLLECTION_MEMBER',
      entity_type: 'User',
      entity_id: newMember._id,
      new_value: { name, username: cleanUsername, mobile }
    });

    res.json({
      _id: newMember._id,
      id: newMember._id,
      name: newMember.name,
      username: newMember.username,
      mobile: newMember.mobile,
      status: newMember.status,
      created_at: newMember.created_at
    });
  } catch (err) {
    console.error('Create member error:', err);
    res.status(500).json({ error: 'Failed to create collection member.' });
  }
});

// PUT /api/members/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, mobile, status } = req.body;
    const oldUser = await User.findById(req.params.id);

    if (!oldUser) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: name ? name.trim() : oldUser.name,
        mobile: mobile !== undefined ? mobile.trim() : oldUser.mobile,
        status: status || oldUser.status
      },
      { new: true }
    );

    await AuditLog.create({
      user_id: req.user._id,
      action: 'UPDATE_COLLECTION_MEMBER',
      entity_type: 'User',
      entity_id: updatedUser._id,
      old_value: { name: oldUser.name, status: oldUser.status },
      new_value: { name: updatedUser.name, status: updatedUser.status }
    });

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update member.' });
  }
});

// POST /api/members/:id/status
router.post('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!user) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    await AuditLog.create({
      user_id: req.user._id,
      action: 'TOGGLE_MEMBER_STATUS',
      entity_type: 'User',
      entity_id: user._id,
      new_value: { status }
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle member status.' });
  }
});

// POST /api/members/:id/reset-password
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password) {
      return res.status(400).json({ error: 'New password is required.' });
    }

    const password_hash = bcrypt.hashSync(new_password, 10);
    const user = await User.findByIdAndUpdate(req.params.id, { password_hash }, { new: true });

    if (!user) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    await AuditLog.create({
      user_id: req.user._id,
      action: 'RESET_MEMBER_PASSWORD',
      entity_type: 'User',
      entity_id: user._id
    });

    res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

module.exports = router;
