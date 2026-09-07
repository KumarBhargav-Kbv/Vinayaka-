const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, AuditLog } = require('../mongo');
const { authenticateToken, JWT_SECRET } = require('../middleware/authMiddleware');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = await User.findOne({ username: cleanUsername });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is disabled. Please contact Admin.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    user.last_login_at = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Audit log
    await AuditLog.create({
      user_id: user._id,
      action: 'USER_LOGIN',
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        mobile: user.mobile,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      username: req.user.username,
      role: req.user.role,
      mobile: req.user.mobile,
      status: req.user.status
    }
  });
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    const isMatch = bcrypt.compareSync(current_password, req.user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    req.user.password_hash = bcrypt.hashSync(new_password, 10);
    await req.user.save();

    await AuditLog.create({
      user_id: req.user._id,
      action: 'PASSWORD_CHANGE',
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

module.exports = router;
