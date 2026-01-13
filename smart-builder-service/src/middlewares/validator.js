const { ValidationError } = require('../errors');

/**
 * Validate customerId or userId is provided
 */
const validateUserIdentifier = (req, res, next) => {
  const { customerId, userId } = req.query;
  
  if (!customerId && !userId) {
    return next(new ValidationError('customerId hoặc userId là bắt buộc'));
  }
  
  next();
};

/**
 * Validate productId is provided
 */
const validateProductId = (req, res, next) => {
  const { productId } = req.query;
  
  if (!productId) {
    return next(new ValidationError('productId là bắt buộc'));
  }
  
  next();
};

/**
 * Validate componentType is provided
 */
const validateComponentType = (req, res, next) => {
  const { componentType } = req.query;
  
  if (!componentType) {
    return next(new ValidationError('componentType là bắt buộc'));
  }
  
  next();
};

module.exports = {
  validateUserIdentifier,
  validateProductId,
  validateComponentType
};

