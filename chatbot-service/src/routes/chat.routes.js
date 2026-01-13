const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { optionalAuth } = require('../middlewares/auth.middleware');
const { contentFilter } = require('../middlewares/contentFilter.middleware');
const { chatRateLimiter } = require('../middlewares/rateLimit.middleware');

// Apply optional auth to all routes
router.use(optionalAuth);

// Create session
router.post('/session', chatController.createSession);

// Send message (with rate limiting and content filtering)
router.post('/message', 
  chatRateLimiter,
  contentFilter,
  chatController.sendMessage
);

// Get chat history
router.get('/history/:sessionId', chatController.getHistory);

// End session
router.delete('/session/:sessionId', chatController.endSession);

// Submit feedback
router.post('/feedback/:sessionId', chatController.submitFeedback);

// Get user sessions (requires auth)
router.get('/sessions', chatController.getUserSessions);

module.exports = router;
