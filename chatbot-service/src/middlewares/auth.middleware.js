const { AuthenticationError } = require('../errors');
const config = require('../config/env');

/**
 * Optional authentication middleware
 * Extracts user ID from JWT token if present, but doesn't require it
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers['x-access-token'];
    
    if (!authHeader) {
      req.user = null;
      return next();
    }

    // Extract token
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      req.user = null;
      return next();
    }

    // If JWT_SECRET is configured, verify token
    if (config.JWT_SECRET) {
      // Simple JWT verification (can be enhanced with jsonwebtoken library)
      // For now, just extract userId from token if it's in the format
      // This is a placeholder - implement proper JWT verification if needed
      try {
        // Basic extraction (would need proper JWT library for full verification)
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          req.user = {
            id: payload.userId || payload.id,
            ...payload
          };
        } else {
          req.user = null;
        }
      } catch (error) {
        req.user = null;
      }
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

/**
 * Required authentication middleware
 */
const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers['x-access-token'];
    
    if (!authHeader) {
      throw new AuthenticationError('Authentication required');
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      throw new AuthenticationError('Invalid authentication token');
    }

    // If JWT_SECRET is configured, verify token
    if (config.JWT_SECRET) {
      // Implement proper JWT verification here
      // This is a placeholder
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          req.user = {
            id: payload.userId || payload.id,
            ...payload
          };
          return next();
        }
      } catch (error) {
        throw new AuthenticationError('Invalid authentication token');
      }
    }

    throw new AuthenticationError('Authentication not configured');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  optionalAuth,
  requireAuth
};

