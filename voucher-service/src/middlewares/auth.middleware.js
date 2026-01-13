const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { UnauthorizedError } = require('../errors');

// Verify JWT token
const verifyToken = (req, res, next) => {
  try {
    // Check for token in both Authorization header (Bearer format) and x-access-token header
    let token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      token = req.headers['x-access-token'];
    }

    if (!token) {
      throw new UnauthorizedError('Token không được cung cấp');
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token đã hết hạn');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Token không hợp lệ');
      }
      throw new UnauthorizedError('Xác thực thất bại');
    }
  } catch (error) {
    next(error);
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  try {
    // Check for token in both Authorization header (Bearer format) and x-access-token header
    let token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      token = req.headers['x-access-token'];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.user = decoded;
      } catch (error) {
        // Ignore token errors for optional auth
        console.log('Optional auth - invalid token:', error.message);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Alias for verifyToken
const requireAuth = verifyToken;

module.exports = {
  verifyToken,
  requireAuth,
  optionalAuth,
};

