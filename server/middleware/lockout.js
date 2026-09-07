const rateLimit = require('express-rate-limit');

// Rate limiter: Max 10 requests per IP per minute
const loginRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Too many login requests from this IP. Please try again after a minute.' },
  standardHeaders: true,
  legacyHeaders: false
});

// In-memory store for account lockout and failed attempts tracking
// Key: username, Value: { failedCount: number, lockUntil: number, lastAttempt: number }
const failureStore = new Map();

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const CAPTCHA_THRESHOLD = 3;

function getLockoutStatus(username) {
  const record = failureStore.get(username);
  if (!record) return { isLocked: false, failedCount: 0, requireCaptcha: false };

  const now = Date.now();
  if (record.lockUntil && record.lockUntil > now) {
    const minutesLeft = Math.ceil((record.lockUntil - now) / (60 * 1000));
    return { 
      isLocked: true, 
      lockUntil: record.lockUntil, 
      minutesLeft, 
      failedCount: record.failedCount, 
      requireCaptcha: true 
    };
  }

  // Lock expired, reset lock
  if (record.lockUntil && record.lockUntil <= now) {
    failureStore.delete(username);
    return { isLocked: false, failedCount: 0, requireCaptcha: false };
  }

  return { 
    isLocked: false, 
    failedCount: record.failedCount, 
    requireCaptcha: record.failedCount >= CAPTCHA_THRESHOLD 
  };
}

async function recordFailedAttempt(username) {
  const now = Date.now();
  const record = failureStore.get(username) || { failedCount: 0, lockUntil: null, lastAttempt: now };
  
  record.failedCount += 1;
  record.lastAttempt = now;

  if (record.failedCount >= LOCKOUT_THRESHOLD) {
    record.lockUntil = now + LOCKOUT_DURATION_MS;
  }

  failureStore.set(username, record);

  // Progressive delay: artificial delay based on failed attempts
  const delayMs = Math.min(record.failedCount * 300, 3000);
  await new Promise(resolve => setTimeout(resolve, delayMs));

  return record;
}

function clearFailedAttempts(username) {
  failureStore.delete(username);
}

module.exports = {
  loginRateLimiter,
  getLockoutStatus,
  recordFailedAttempt,
  clearFailedAttempts
};
