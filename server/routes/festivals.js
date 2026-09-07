const express = require('express');
const router = express.Router();
const { Festival, AuditLog } = require('../mongo');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// GET /api/festivals (All authenticated users can list festivals to select/view active)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const festivals = await Festival.find().sort({ year: -1 });
    res.json(festivals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch festivals.' });
  }
});

// GET /api/festivals/active
router.get('/active', authenticateToken, async (req, res) => {
  try {
    let active = await Festival.findOne({ status: 'active' });
    if (!active) {
      active = await Festival.findOne().sort({ year: -1 });
    }
    res.json(active || null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch active festival.' });
  }
});

// Admin endpoints below
router.use(authenticateToken, requireRole('admin'));

// POST /api/festivals
router.post('/', async (req, res) => {
  try {
    const { name, year, start_date, end_date, status } = req.body;

    if (!name || !year) {
      return res.status(400).json({ error: 'Festival name and year are required.' });
    }

    if (status === 'active') {
      await Festival.updateMany({ status: 'active' }, { status: 'completed' });
    }

    const festival = await Festival.create({
      name,
      year: Number(year),
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined,
      status: status || 'draft'
    });

    await AuditLog.create({
      user_id: req.user._id,
      action: 'CREATE_FESTIVAL',
      entity_type: 'Festival',
      entity_id: festival._id,
      new_value: festival
    });

    res.json(festival);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create festival: ' + err.message });
  }
});

// PUT /api/festivals/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, year, start_date, end_date, status } = req.body;
    const oldFestival = await Festival.findById(req.params.id);
    if (!oldFestival) {
      return res.status(404).json({ error: 'Festival not found.' });
    }

    if (status === 'active' && oldFestival.status !== 'active') {
      await Festival.updateMany({ status: 'active' }, { status: 'completed' });
    }

    const festival = await Festival.findByIdAndUpdate(
      req.params.id,
      {
        name,
        year: Number(year),
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date ? new Date(end_date) : undefined,
        status
      },
      { new: true }
    );

    await AuditLog.create({
      user_id: req.user._id,
      action: 'UPDATE_FESTIVAL',
      entity_type: 'Festival',
      entity_id: festival._id,
      old_value: oldFestival,
      new_value: festival
    });

    res.json(festival);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update festival.' });
  }
});

// POST /api/festivals/:id/activate
router.post('/:id/activate', async (req, res) => {
  try {
    await Festival.updateMany({ status: 'active' }, { status: 'completed' });
    const festival = await Festival.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    );

    await AuditLog.create({
      user_id: req.user._id,
      action: 'ACTIVATE_FESTIVAL',
      entity_type: 'Festival',
      entity_id: festival._id
    });

    res.json(festival);
  } catch (err) {
    res.status(500).json({ error: 'Failed to activate festival.' });
  }
});

module.exports = router;
