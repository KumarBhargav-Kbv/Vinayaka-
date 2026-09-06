const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { logAudit } = require('../utils/audit');

// GET /api/settings - Public or Authenticated
router.get('/', (req, res) => {
  const settings = db.prepare('SELECT * FROM committee_settings WHERE id = 1').get();
  res.json(settings || {});
});

// PUT /api/settings - Update committee information & prefix (Admin only)
router.put('/', authenticateToken, requireAdmin, (req, res) => {
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
    receipt_prefix
  } = req.body;

  const current = db.prepare('SELECT * FROM committee_settings WHERE id = 1').get();

  db.prepare(`
    UPDATE committee_settings SET
      committee_name = ?,
      festival_name = ?,
      festival_year = ?,
      address = ?,
      village_city = ?,
      contact_number = ?,
      whatsapp_number = ?,
      email = ?,
      website = ?,
      committee_members = ?,
      thank_you_message = ?,
      footer_message = ?,
      receipt_prefix = ?
    WHERE id = 1
  `).run(
    committee_name !== undefined ? committee_name : current.committee_name,
    festival_name !== undefined ? festival_name : current.festival_name,
    festival_year !== undefined ? festival_year : current.festival_year,
    address !== undefined ? address : current.address,
    village_city !== undefined ? village_city : current.village_city,
    contact_number !== undefined ? contact_number : current.contact_number,
    whatsapp_number !== undefined ? whatsapp_number : current.whatsapp_number,
    email !== undefined ? email : current.email,
    website !== undefined ? website : current.website,
    committee_members !== undefined ? committee_members : current.committee_members,
    thank_you_message !== undefined ? thank_you_message : current.thank_you_message,
    footer_message !== undefined ? footer_message : current.footer_message,
    receipt_prefix !== undefined ? receipt_prefix.trim() : current.receipt_prefix
  );

  logAudit(db, req.user.id, null, 'UPDATE_SETTINGS', current, req.body);

  const updated = db.prepare('SELECT * FROM committee_settings WHERE id = 1').get();
  res.json({ message: 'Settings updated successfully', settings: updated });
});

// POST /api/settings/upload-logo
router.post('/upload-logo', authenticateToken, requireAdmin, upload.single('logo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No logo image file provided' });
  }

  const logoUrl = `/uploads/${req.file.filename}`;
  db.prepare('UPDATE committee_settings SET logo = ? WHERE id = 1').run(logoUrl);

  logAudit(db, req.user.id, null, 'UPLOAD_LOGO', null, { logoUrl });

  res.json({ message: 'Logo uploaded successfully', logoUrl });
});

// DELETE /api/settings/logo
router.delete('/logo', authenticateToken, requireAdmin, (req, res) => {
  db.prepare("UPDATE committee_settings SET logo = '' WHERE id = 1").run();
  logAudit(db, req.user.id, null, 'REMOVE_LOGO', null, null);

  // Sync to MongoDB if configured
  try {
    const { CommitteeSettings } = require('../mongo');
    CommitteeSettings.findOneAndUpdate({}, { logo: '' }, { upsert: true }).exec();
  } catch (err) {}

  const updated = db.prepare('SELECT * FROM committee_settings WHERE id = 1').get();
  res.json({ message: 'Logo removed successfully', logoUrl: '', settings: updated });
});

// POST /api/settings/upload-photo (Committee Group Photo)
router.post('/upload-photo', authenticateToken, requireAdmin, upload.single('group_photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No group photo image file provided' });
  }

  const photoUrl = `/uploads/${req.file.filename}`;
  db.prepare('UPDATE committee_settings SET group_photo = ? WHERE id = 1').run(photoUrl);

  logAudit(db, req.user.id, null, 'UPLOAD_GROUP_PHOTO', null, { photoUrl });

  // Sync to MongoDB if configured
  try {
    const { CommitteeSettings } = require('../mongo');
    CommitteeSettings.findOneAndUpdate({}, { group_photo: photoUrl }, { upsert: true }).exec();
  } catch (err) {}

  res.json({ message: 'Committee group photo uploaded successfully', photoUrl });
});

// DELETE /api/settings/photo
router.delete('/photo', authenticateToken, requireAdmin, (req, res) => {
  db.prepare("UPDATE committee_settings SET group_photo = '' WHERE id = 1").run();
  logAudit(db, req.user.id, null, 'REMOVE_GROUP_PHOTO', null, null);

  // Sync to MongoDB if configured
  try {
    const { CommitteeSettings } = require('../mongo');
    CommitteeSettings.findOneAndUpdate({}, { group_photo: '' }, { upsert: true }).exec();
  } catch (err) {}

  const updated = db.prepare('SELECT * FROM committee_settings WHERE id = 1').get();
  res.json({ message: 'Group photo removed successfully', photoUrl: '', settings: updated });
});

module.exports = router;
