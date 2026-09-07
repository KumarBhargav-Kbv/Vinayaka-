const { z } = require('zod');

// HTML/JS Sanitization helper
function sanitizeText(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>?/gm, '').trim();
}

// Zod Schema for Login Input
const loginSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Username contains invalid characters'),
  password: z.string()
    .min(4, 'Password must be at least 4 characters')
    .max(100, 'Password length invalid')
});

// Middleware to validate login request body
function validateLogin(req, res, next) {
  try {
    if (req.body.username) {
      req.body.username = sanitizeText(req.body.username);
    }
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      // Use generic error message for security
      return res.status(400).json({ error: 'Incorrect email or password.' });
    }
    req.body = result.data;
    next();
  } catch (err) {
    return res.status(400).json({ error: 'Incorrect email or password.' });
  }
}

module.exports = {
  sanitizeText,
  loginSchema,
  validateLogin
};
