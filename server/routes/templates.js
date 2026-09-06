const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

// GET /api/templates/:type
router.get('/:type', authenticateToken, (req, res) => {
  const { type } = req.params;
  if (!['donation', 'sponsorship'].includes(type)) {
    return res.status(400).json({ error: 'Invalid template type' });
  }

  const row = db.prepare('SELECT * FROM receipt_templates WHERE receipt_type = ?').get(type);
  if (!row) {
    return res.status(404).json({ error: 'Template not found' });
  }

  res.json({
    id: row.id,
    receipt_type: row.receipt_type,
    template_data: JSON.parse(row.template_data),
    updated_at: row.updated_at
  });
});

// PUT /api/templates/:type (Admin only)
router.put('/:type', authenticateToken, requireAdmin, (req, res) => {
  const { type } = req.params;
  const { template_data } = req.body;

  if (!['donation', 'sponsorship'].includes(type)) {
    return res.status(400).json({ error: 'Invalid template type' });
  }

  if (!template_data) {
    return res.status(400).json({ error: 'template_data object is required' });
  }

  const existing = db.prepare('SELECT * FROM receipt_templates WHERE receipt_type = ?').get(type);

  const jsonStr = typeof template_data === 'string' ? template_data : JSON.stringify(template_data);

  if (existing) {
    db.prepare(`
      UPDATE receipt_templates SET template_data = ?, updated_at = DATETIME('now') WHERE receipt_type = ?
    `).run(jsonStr, type);
  } else {
    db.prepare(`
      INSERT INTO receipt_templates (receipt_type, template_data) VALUES (?, ?)
    `).run(type, jsonStr);
  }

  logAudit(db, req.user.id, null, 'UPDATE_RECEIPT_TEMPLATE', existing ? JSON.parse(existing.template_data) : null, template_data);

  res.json({ message: `${type} receipt template saved successfully` });
});

module.exports = router;
