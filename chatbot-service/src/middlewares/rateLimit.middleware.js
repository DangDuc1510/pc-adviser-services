const rateLimit = require('express-rate-limit');
const config = require('../config/env');

/**
 * Chat-specific rate limiter
 * More restrictive than general API rate limiting
 */
const chatRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too many chat requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use session ID or IP as key
  keyGenerator: (req) => {
    return req.body?.sessionId || req.ip;
  },
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many chat requests. Please try again later.',
      retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000)
    });
  }
});

module.exports = {
  chatRateLimiter
};

