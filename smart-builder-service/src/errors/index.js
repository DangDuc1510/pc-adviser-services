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

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
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

class ExternalServiceError extends AppError {
  constructor(message = 'External service error', statusCode = 502) {
    super(message, statusCode);
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database error') {
    super(message, 500);
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
    message = `${field} đã tồn tại`;
    statusCode = 409;
  }

  // MongoDB CastError
  if (err.name === 'CastError') {
    message = 'ID không hợp lệ';
    statusCode = 400;
  }

  // Axios errors (external service calls)
  if (err.isAxiosError) {
    statusCode = err.response?.status || 502;
    message = err.response?.data?.message || 'External service error';
  }

  res.status(statusCode).json({
    success: false,
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  ExternalServiceError,
  DatabaseError,
  errorHandler
};

