const express = require('express');
const router = express.Router();
const { ReceiptTemplate, AuditLog } = require('../mongo');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// GET /api/templates
router.get('/', authenticateToken, async (req, res) => {
  try {
    const templates = await ReceiptTemplate.find({ is_active: true });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch receipt templates.' });
  }
});

// GET /api/templates/:type
router.get('/:type', authenticateToken, async (req, res) => {
  try {
    const type = req.params.type.toLowerCase();
    const template = await ReceiptTemplate.findOne({ receipt_type: type, is_active: true });
    if (!template) {
      return res.status(404).json({ error: 'Template not found for type: ' + type });
    }
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch template.' });
  }
});

// Admin endpoints below
router.use(authenticateToken, requireRole('admin'));

// PUT /api/templates/:type (Update template design & fields with template version incrementing)
router.put('/:type', async (req, res) => {
  try {
    const type = req.params.type.toLowerCase();
    const { template_name, design, fields } = req.body;

    let template = await ReceiptTemplate.findOne({ receipt_type: type, is_active: true });
    const oldVersion = template ? template.version : 0;
    const newVersion = oldVersion + 1;

    if (template) {
      template.version = newVersion;
      if (template_name) template.template_name = template_name;
      if (design) template.design = { ...template.design, ...design };
      if (fields) template.fields = fields;
      template.updated_by = req.user._id;
      await template.save();
    } else {
      template = await ReceiptTemplate.create({
        receipt_type: type,
        template_name: template_name || `${type.toUpperCase()} Receipt Template`,
        version: 1,
        is_active: true,
        design,
        fields,
        updated_by: req.user._id
      });
    }

    await AuditLog.create({
      user_id: req.user._id,
      action: 'UPDATE_RECEIPT_TEMPLATE',
      entity_type: 'ReceiptTemplate',
      entity_id: template._id,
      new_value: { receipt_type: type, version: template.version }
    });

    res.json(template);
  } catch (err) {
    console.error('Update template error:', err);
    res.status(500).json({ error: 'Failed to update receipt template.' });
  }
});

module.exports = router;
