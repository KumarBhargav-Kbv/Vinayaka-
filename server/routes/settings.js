const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { CommitteeSettings, AuditLog } = require('../mongo');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Memory storage for logo and group photo uploads (stored directly in MongoDB as Base64 Data URLs)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image format. Allowed: PNG, JPG, JPEG, WEBP'));
    }
  }
});

// GET /api/settings (All authenticated users can view settings for rendering receipts)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let settings = await CommitteeSettings.findOne();
    if (!settings) {
      settings = await CommitteeSettings.create({});
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

// Admin endpoints below
router.use(authenticateToken, requireRole('admin'));

// PUT /api/settings (Update Committee Info & Receipt Number Config)
router.put('/', async (req, res) => {
  try {
    let settings = await CommitteeSettings.findOne();
    const oldSettings = settings ? settings.toObject() : {};

    const {
      committee_name,
      festival_name,
      festival_year,
      address,
      village_city,
      contact_number,
      whatsapp_number,
      email,
      website,
      committee_members,
      thank_you_message,
      footer_message,
      receipt_number_config,
      logo,
      group_photo
    } = req.body;

    if (settings) {
      if (committee_name !== undefined) settings.committee_name = committee_name;
      if (festival_name !== undefined) settings.festival_name = festival_name;
      if (festival_year !== undefined) settings.festival_year = festival_year;
      if (address !== undefined) settings.address = address;
      if (village_city !== undefined) settings.village_city = village_city;
      if (contact_number !== undefined) settings.contact_number = contact_number;
      if (whatsapp_number !== undefined) settings.whatsapp_number = whatsapp_number;
      if (email !== undefined) settings.email = email;
      if (website !== undefined) settings.website = website;
      if (committee_members !== undefined) settings.committee_members = committee_members;
      if (thank_you_message !== undefined) settings.thank_you_message = thank_you_message;
      if (footer_message !== undefined) settings.footer_message = footer_message;
      if (receipt_number_config !== undefined) settings.receipt_number_config = receipt_number_config;
      if (logo !== undefined) settings.logo = { ...settings.logo, ...logo };
      if (group_photo !== undefined) settings.group_photo = { ...settings.group_photo, ...group_photo };

      await settings.save();
    } else {
      settings = await CommitteeSettings.create(req.body);
    }

    await AuditLog.create({
      user_id: req.user._id,
      action: 'UPDATE_COMMITTEE_SETTINGS',
      entity_type: 'CommitteeSettings',
      entity_id: settings._id,
      old_value: oldSettings,
      new_value: settings
    });

    res.json(settings);
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

// POST /api/settings/logo (Upload Logo to MongoDB)
router.post('/logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const base64Data = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64Data}`;

    let settings = await CommitteeSettings.findOne();
    if (!settings) {
      settings = await CommitteeSettings.create({});
    }

    settings.logo = {
      ...settings.logo,
      url: dataUrl,
      public_id: req.file.originalname,
      enabled: true
    };
    await settings.save();

    await AuditLog.create({
      user_id: req.user._id,
      action: 'UPLOAD_LOGO',
      entity_type: 'CommitteeSettings',
      new_value: { public_id: req.file.originalname }
    });

    res.json({ message: 'Logo uploaded and saved to database successfully.', logo: settings.logo });
  } catch (err) {
    res.status(500).json({ error: 'Logo upload failed: ' + err.message });
  }
});

// POST /api/settings/group-photo (Upload Group Photo to MongoDB)
router.post('/group-photo', upload.single('group_photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const base64Data = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64Data}`;

    let settings = await CommitteeSettings.findOne();
    if (!settings) {
      settings = await CommitteeSettings.create({});
    }

    settings.group_photo = {
      ...settings.group_photo,
      url: dataUrl,
      public_id: req.file.originalname,
      enabled: true
    };
    await settings.save();

    await AuditLog.create({
      user_id: req.user._id,
      action: 'UPLOAD_GROUP_PHOTO',
      entity_type: 'CommitteeSettings',
      new_value: { public_id: req.file.originalname }
    });

    res.json({ message: 'Group photo uploaded and saved to database successfully.', group_photo: settings.group_photo });
  } catch (err) {
    res.status(500).json({ error: 'Group photo upload failed: ' + err.message });
  }
});

// POST /api/settings/remove-image
router.post('/remove-image', async (req, res) => {
  try {
    const { type } = req.body; // 'logo' or 'group_photo'
    let settings = await CommitteeSettings.findOne();
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found.' });
    }

    if (type === 'logo') {
      settings.logo.url = '';
      settings.logo.public_id = '';
      settings.logo.enabled = false;
    } else if (type === 'group_photo') {
      settings.group_photo.url = '';
      settings.group_photo.public_id = '';
      settings.group_photo.enabled = false;
    }

    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove image.' });
  }
});

module.exports = router;
