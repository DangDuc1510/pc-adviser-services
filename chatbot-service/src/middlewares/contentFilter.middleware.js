const { ValidationError } = require('../errors');
const moderationService = require('../services/moderation.service');

/**
 * Content filter middleware
 * Checks messages for prompt injection, blocked content, etc.
 */
const contentFilter = (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message) {
      return next();
    }

    // Moderate message
    const moderationResult = moderationService.moderateMessage(message);

    if (!moderationResult.allowed) {
      throw new ValidationError(moderationResult.reason || 'Message failed content moderation');
    }

    // Replace message with sanitized version
    if (moderationResult.sanitized) {
      req.body.message = moderationResult.sanitized;
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  contentFilter
};

