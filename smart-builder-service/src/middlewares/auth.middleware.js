const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { AuthenticationError, AuthorizationError } = require('../errors');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    // Check for token in both Authorization header (Bearer format) and x-access-token header
    let token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      token = req.headers['x-access-token'];
    }

    if (!token) {
      throw new AuthenticationError('Token không được cung cấp');
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET || process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token đã hết hạn');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new AuthenticationError('Token không hợp lệ');
      }
      throw new AuthenticationError('Xác thực thất bại');
    }
  } catch (error) {
    next(error);
  }
};

// Authorize by role
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        throw new AuthenticationError('Thông tin vai trò người dùng không tìm thấy');
      }
      if (roles.length && !roles.includes(req.user.role)) {
        throw new AuthorizationError('Bạn không có quyền truy cập tính năng này');
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authenticate,
  authorize,
};

