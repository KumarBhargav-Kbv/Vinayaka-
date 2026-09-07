const jwt = require('jsonwebtoken');
const { User } = require('../mongo');

const JWT_SECRET = process.env.JWT_SECRET || 'vinayaka_chavithi_secret_key_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired authentication token.' });
    }

    try {
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ error: 'User account no longer exists.' });
      }

      if (user.status !== 'active') {
        return res.status(403).json({ error: 'User account has been disabled.' });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Server authentication error.' });
    }
  });
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permission denied. Insufficient role permissions.' });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET
};
