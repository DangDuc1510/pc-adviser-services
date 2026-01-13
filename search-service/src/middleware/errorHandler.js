const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body,
  });

  // Elasticsearch errors
  if (err.name === 'ResponseError') {
    return res.status(503).json({
      success: false,
      error: 'Search service temporarily unavailable',
      message: 'Elasticsearch connection error',
    });
  }

  // Validation errors
  if (err.name === 'ValidationError' || err.isJoi) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      message: err.message,
      details: err.details || err.errors,
    });
  }

  // Custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message || 'An error occurred',
      ...(err.details && { details: err.details }),
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && {
      stack: err.stack,
    }),
  });
};

module.exports = errorHandler;

