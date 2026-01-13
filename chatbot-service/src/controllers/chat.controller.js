const chatService = require('../services/chat.service');
const { validateMessageRequest, validateCreateSessionRequest, validatePagination, validateFeedback } = require('../validators/chat.validator');
const { ValidationError, NotFoundError } = require('../errors');
const logger = require('../utils/logger');

/**
 * Create a new chat session
 */
exports.createSession = async (req, res, next) => {
  try {
    const validated = validateCreateSessionRequest(req.body);
    const userId = req.user?.id || validated.userId || null;

    const session = await chatService.createSession(userId);

    res.status(201).json({
      status: 'success',
      data: {
        sessionId: session.sessionId,
        userId: session.userId,
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    logger.error('Error creating session:', error);
    next(error);
  }
};

/**
 * Send a message
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const validated = validateMessageRequest(req.body);
    const userId = req.user?.id || validated.userId || null;

    const result = await chatService.processMessage(
      validated.sessionId,
      validated.message,
      userId
    );

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error('Error sending message:', error);
    next(error);
  }
};

/**
 * Get chat history
 */
exports.getHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { page, limit } = req.query;

    if (!sessionId) {
      throw new ValidationError('Session ID is required');
    }

    const pagination = validatePagination(page, limit);
    const history = await chatService.getHistory(sessionId, pagination.page, pagination.limit);

    res.json({
      status: 'success',
      data: history
    });
  } catch (error) {
    logger.error('Error getting history:', error);
    next(error);
  }
};

/**
 * End a chat session
 */
exports.endSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      throw new ValidationError('Session ID is required');
    }

    await chatService.endSession(sessionId);

    res.json({
      status: 'success',
      message: 'Session ended successfully'
    });
  } catch (error) {
    logger.error('Error ending session:', error);
    next(error);
  }
};

/**
 * Submit feedback for a session
 */
exports.submitFeedback = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const feedback = validateFeedback(req.body);

    if (!sessionId) {
      throw new ValidationError('Session ID is required');
    }

    await chatService.submitFeedback(sessionId, feedback);

    res.json({
      status: 'success',
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    logger.error('Error submitting feedback:', error);
    next(error);
  }
};

/**
 * Get user sessions
 */
exports.getUserSessions = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const { page, limit } = req.query;
    const pagination = validatePagination(page, limit);

    const result = await chatService.getUserSessions(userId, pagination.page, pagination.limit);

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error('Error getting user sessions:', error);
    next(error);
  }
};
