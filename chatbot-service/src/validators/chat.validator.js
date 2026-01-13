const { ValidationError } = require('../errors');
const config = require('../config/env');

/**
 * Validate message content
 */
const validateMessage = (message) => {
  if (!message || typeof message !== 'string') {
    throw new ValidationError('Message is required');
  }

  const trimmed = message.trim();
  
  if (trimmed.length === 0) {
    throw new ValidationError('Message cannot be empty');
  }

  if (trimmed.length > config.MESSAGE_MAX_LENGTH) {
    throw new ValidationError(`Message exceeds maximum length of ${config.MESSAGE_MAX_LENGTH} characters`);
  }

  return trimmed;
};

/**
 * Validate session ID
 */
const validateSessionId = (sessionId) => {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new ValidationError('Session ID is required');
  }

  const trimmed = sessionId.trim();
  
  if (trimmed.length === 0) {
    throw new ValidationError('Session ID cannot be empty');
  }

  // UUID format validation (basic)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(trimmed)) {
    throw new ValidationError('Invalid session ID format');
  }

  return trimmed;
};

/**
 * Validate user ID (optional)
 */
const validateUserId = (userId) => {
  if (!userId) {
    return null; // userId is optional
  }

  if (typeof userId !== 'string') {
    throw new ValidationError('User ID must be a string');
  }

  const trimmed = userId.trim();
  
  if (trimmed.length === 0) {
    return null;
  }

  // MongoDB ObjectId format (24 hex characters)
  const objectIdRegex = /^[0-9a-f]{24}$/i;
  if (!objectIdRegex.test(trimmed)) {
    throw new ValidationError('Invalid user ID format');
  }

  return trimmed;
};

/**
 * Validate pagination parameters
 */
const validatePagination = (page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = Math.min(parseInt(limit) || 20, 100); // Max 100 items per page

  if (pageNum < 1) {
    throw new ValidationError('Page must be greater than 0');
  }

  if (limitNum < 1) {
    throw new ValidationError('Limit must be greater than 0');
  }

  return { page: pageNum, limit: limitNum };
};

/**
 * Validate feedback data
 */
const validateFeedback = (feedback) => {
  if (!feedback || typeof feedback !== 'object') {
    throw new ValidationError('Feedback is required');
  }

  const validated = {};

  if (feedback.rating !== undefined) {
    const rating = parseInt(feedback.rating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      throw new ValidationError('Rating must be a number between 1 and 5');
    }
    validated.rating = rating;
  }

  if (feedback.helpful !== undefined) {
    if (typeof feedback.helpful !== 'boolean') {
      throw new ValidationError('Helpful must be a boolean');
    }
    validated.helpful = feedback.helpful;
  }

  if (feedback.resolved !== undefined) {
    if (typeof feedback.resolved !== 'boolean') {
      throw new ValidationError('Resolved must be a boolean');
    }
    validated.resolved = feedback.resolved;
  }

  if (feedback.comments !== undefined) {
    if (typeof feedback.comments !== 'string') {
      throw new ValidationError('Comments must be a string');
    }
    validated.comments = feedback.comments.trim();
  }

  return validated;
};

/**
 * Validate message request
 */
const validateMessageRequest = (body) => {
  const { sessionId, message, userId } = body;

  return {
    sessionId: validateSessionId(sessionId),
    message: validateMessage(message),
    userId: validateUserId(userId)
  };
};

/**
 * Validate session creation request
 */
const validateCreateSessionRequest = (body) => {
  const { userId } = body || {};

  return {
    userId: validateUserId(userId)
  };
};

module.exports = {
  validateMessage,
  validateSessionId,
  validateUserId,
  validatePagination,
  validateFeedback,
  validateMessageRequest,
  validateCreateSessionRequest
};

