const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

// All routes here require Admin role
router.use(authenticateToken, requireAdmin);

// GET /api/members - list all collection members & admins
router.get('/', (req, res) => {
  const users = db.prepare(`
    SELECT id, name, username, role, status, created_at,
    (SELECT COUNT(*) FROM transactions WHERE collection_member_id = users.id) AS total_collections,
    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE collection_member_id = users.id AND receipt_type = 'donation') AS total_donations_amount
    FROM users
    ORDER BY created_at DESC
  `).all();

  res.json(users);
});

// POST /api/members - create new member
router.post('/', (req, res) => {
  const { name, username, password, role } = req.body;

  if (!name || !username || !password) {
    return res.status(400).json({ error: 'Name, username, and password are required' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUsername);
  if (existing) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const userRole = role === 'ADMIN' ? 'ADMIN' : 'MEMBER';

  const stmt = db.prepare(`
    INSERT INTO users (name, username, password_hash, role, status)
    VALUES (?, ?, ?, ?, 'ACTIVE')
  `);
  const result = stmt.run(name.trim(), cleanUsername, passwordHash, userRole);

  const newUser = db.prepare('SELECT id, name, username, role, status, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

  logAudit(db, req.user.id, null, 'CREATE_MEMBER', null, { memberId: newUser.id, name: newUser.name, role: newUser.role });

  res.status(201).json(newUser);
});

// PUT /api/members/:id - edit member (name, status, role)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, status, role } = req.body;

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Member not found' });
  }

  const updatedName = name !== undefined ? name.trim() : existing.name;
  const updatedStatus = status !== undefined && ['ACTIVE', 'DISABLED'].includes(status) ? status : existing.status;
  const updatedRole = role !== undefined && ['ADMIN', 'MEMBER'].includes(role) ? role : existing.role;

  db.prepare(`
    UPDATE users SET name = ?, status = ?, role = ? WHERE id = ?
  `).run(updatedName, updatedStatus, updatedRole, id);

  logAudit(db, req.user.id, null, 'UPDATE_MEMBER', existing, { id, name: updatedName, status: updatedStatus, role: updatedRole });

  res.json({ message: 'Member updated successfully' });
});

// PUT /api/members/:id/reset-password
router.put('/:id/reset-password', (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long' });
  }

  const existing = db.prepare('SELECT id, name FROM users WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Member not found' });
  }

  const passwordHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, id);

  logAudit(db, req.user.id, null, 'RESET_PASSWORD', null, { targetUserId: id });

  res.json({ message: `Password reset successfully for ${existing.name}` });
});

// DELETE /api/members/:id - delete member account
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Member not found' });
  }

  if (existing.id === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own logged-in admin account' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  logAudit(db, req.user.id, null, 'DELETE_MEMBER', existing, { id, name: existing.name });

  res.json({ message: 'Member deleted successfully' });
});

module.exports = router;
