class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation Error') {
    super(message, 400);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database error') {
    super(message, 500);
  }
}

class ExternalServiceError extends AppError {
  constructor(message = 'External service error', statusCode = 502) {
    super(message, statusCode);
  }
}

const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message } = err;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    message = `Validation Error: ${errors.join(', ')}`;
    statusCode = 400;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
    statusCode = 409;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Token expired';
    statusCode = 401;
  }

  // MongoDB CastError
  if (err.name === 'CastError') {
    message = 'Invalid ID';
    statusCode = 400;
  }

  res.status(statusCode).json({
    status: 'error',
    message
  });
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
  errorHandler
};

