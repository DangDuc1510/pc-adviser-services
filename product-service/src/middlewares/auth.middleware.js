const jwt = require("jsonwebtoken");
const config = require("../config/env");

// Optional authentication middleware - doesn't fail if no token
// This allows endpoints to work with or without authentication
const optionalAuth = (req, res, next) => {
  try {
    // Check for token in both Authorization header (Bearer format) and x-access-token header
    let token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      token = req.headers["x-access-token"];
    }

    if (!token) {
      // No token provided - continue without setting req.user
      req.user = null;
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(
        token,
        config.JWT_SECRET || process.env.JWT_SECRET
      );
      req.user = decoded;
      next();
    } catch (error) {
      // Invalid token - continue without setting req.user
      // Don't throw error for optional auth
      req.user = null;
      next();
    }
  } catch (error) {
    // Any other error - continue without setting req.user
    req.user = null;
    next();
  }
};

module.exports = {
  optionalAuth,
};
