const express = require('express');
const router = express.Router();
const { AuditLog } = require('../mongo');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken, requireRole('admin'));

// GET /api/audit
router.get('/', async (req, res) => {
  try {
    const { action, user_id, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (action) {
      filter.action = action;
    }
    if (user_id) {
      filter.user_id = user_id;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const logs = await AuditLog.find(filter)
      .populate('user_id', 'name username role')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await AuditLog.countDocuments(filter);

    res.json({
      logs,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
});

module.exports = router;
