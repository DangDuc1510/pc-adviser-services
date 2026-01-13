const { ForbiddenError } = require("../errors");

// Check if user has required permission
const checkPermission = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ForbiddenError("Yêu cầu đăng nhập");
      }

      // Admin has all permissions
      if (req.user.role === "admin") {
        return next();
      }

      // Check if user has the required permission
      if (req.user.permissions && req.user.permissions.includes(permission)) {
        return next();
      }

      throw new ForbiddenError("Không có quyền thực hiện thao tác này");
    } catch (error) {
      next(error);
    }
  };
};

// Check if user has any of the required permissions
const checkAnyPermission = (permissions) => {
  if (typeof permissions === "string") {
    permissions = [permissions];
  }

  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ForbiddenError("Yêu cầu đăng nhập");
      }

      // Admin has all permissions
      if (req.user.role === "admin") {
        return next();
      }

      // Check if user has any of the required permissions
      if (
        req.user.permissions &&
        permissions.some((perm) => req.user.permissions.includes(perm))
      ) {
        return next();
      }

      throw new ForbiddenError("Không có quyền thực hiện thao tác này");
    } catch (error) {
      next(error);
    }
  };
};

// Check if user has one of the required roles
const authorize = (roles) => {
  if (typeof roles === "string") {
    roles = [roles];
  }

  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ForbiddenError("Yêu cầu đăng nhập");
      }

      if (!roles.includes(req.user.role)) {
        throw new ForbiddenError("Bạn không có quyền truy cập tính năng này");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      throw new ForbiddenError("Yêu cầu đăng nhập");
    }

    if (req.user.role !== "admin") {
      throw new ForbiddenError("Chỉ admin mới có quyền thực hiện thao tác này");
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Check if user is owner or admin
const isOwnerOrAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      throw new ForbiddenError("Yêu cầu đăng nhập");
    }

    // Admin can access everything
    if (req.user.role === "admin") {
      return next();
    }

    // Check if user is the owner (userId from params or body)
    const resourceUserId = req.params.userId || req.body.userId;

    if (resourceUserId && resourceUserId !== req.user.id) {
      throw new ForbiddenError("Không có quyền truy cập tài nguyên này");
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkPermission,
  checkAnyPermission,
  authorize,
  isAdmin,
  isOwnerOrAdmin,
};
