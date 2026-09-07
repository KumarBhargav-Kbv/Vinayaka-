const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');
const { validateLogin } = require('../middleware/validation');
const { 
  loginRateLimiter, 
  getLockoutStatus, 
  recordFailedAttempt, 
  clearFailedAttempts 
} = require('../middleware/lockout');

// Pre-computed dummy hash for timing equalization when user doesn't exist
const DUMMY_HASH = bcrypt.hashSync('dummy_password_for_equalization_123', 12);

// Generic authentication error message (Security Requirement #4)
const GENERIC_AUTH_ERROR = 'Incorrect email or password.';

// POST /api/auth/login with Zod validation and rate limiting
router.post('/login', loginRateLimiter, validateLogin, async (req, res) => {
  const { username, password } = req.body;
  const cleanUsername = username.trim().toLowerCase();

  // 1. Check Account Lockout status
  const lockoutStatus = getLockoutStatus(cleanUsername);
  if (lockoutStatus.isLocked) {
    return res.status(429).json({ 
      error: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${lockoutStatus.minutesLeft} minutes.`,
      lockout: true
    });
  }

  // 2. Fetch User from Database
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(cleanUsername);

  // 3. Timing Equalization: Execute bcrypt comparison regardless of user existence
  const hashToCompare = user ? user.password_hash : DUMMY_HASH;
  const isPasswordValid = bcrypt.compareSync(password, hashToCompare);

  // 4. Verify account status & credentials
  if (!user || !isPasswordValid || user.status === 'DISABLED') {
    // Record failed attempt, apply progressive delay, and return generic error message
    const updatedStatus = await recordFailedAttempt(cleanUsername);
    
    return res.status(401).json({ 
      error: GENERIC_AUTH_ERROR,
      requireCaptcha: updatedStatus.failedCount >= 3
    });
  }

  // 5. Successful Login -> Clear failed attempts
  clearFailedAttempts(cleanUsername);

  // 6. Sign JWT token
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Audit log (never log password!)
  logAudit(db, user.id, null, 'USER_LOGIN', null, { username: user.username, role: user.role });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role
    }
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
