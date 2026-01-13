const jwt = require("jsonwebtoken");
const { client: redisClient } = require("../config/redis");
const authService = require("../services/auth.service");
const { AuthenticationError } = require("../errors");

const authenticate = async (req, res, next) => {
  try {
    // Check for token in both Authorization header (Bearer format) and x-access-token header
    let token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      token = req.headers["x-access-token"];
    }
    if (!token) {
      throw new AuthenticationError("Token không được cung cấp");
    }

    // Check blacklist
    const isBlacklisted = await authService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new AuthenticationError("Token đã bị vô hiệu hóa");
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      next(new AuthenticationError("Token không hợp lệ"));
    } else if (err.name === "TokenExpiredError") {
      next(new AuthenticationError("Token đã hết hạn"));
    } else {
      next(err);
    }
  }
};

const authorize = (roles = []) => {
  if (typeof roles === "string") {
    roles = [roles];
  }
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        throw new AuthenticationError(
          "Thông tin vai trò người dùng không tìm thấy"
        );
      }
      if (roles.length && !roles.includes(req.user.role)) {
        const { AuthorizationError } = require("../errors");
        throw new AuthorizationError(
          "Bạn không có quyền truy cập tính năng này"
        );
      }
      // authentication and authorization successful
      next();
    } catch (error) {
      next(error);
    }
  };
};

const checkPermission = (requiredPermissions = []) => {
  if (typeof requiredPermissions === "string") {
    requiredPermissions = [requiredPermissions];
  }

  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        throw new AuthenticationError("Thông tin người dùng không tìm thấy");
      }

      // Get user permissions
      const userService = require("../services/user.service");
      const userPermissions = await userService.getUserPermissions(req.user.id);

      // Check if user has required permissions
      const hasPermission = requiredPermissions.every((perm) =>
        userPermissions.includes(perm)
      );
      if (!hasPermission) {
        const { AuthorizationError } = require("../errors");
        throw new AuthorizationError(
          "Bạn không có quyền truy cập tính năng này"
        );
      }

      req.userPermissions = userPermissions;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authenticate,
  authorize,
  checkPermission,
};
