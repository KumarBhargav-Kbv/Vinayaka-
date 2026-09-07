const { authenticateToken, requireRole, JWT_SECRET } = require('./authMiddleware');

function requireAdmin(req, res, next) {
  return requireRole('admin')(req, res, next);
}

module.exports = { authenticateToken, requireAdmin, JWT_SECRET };

