const { body, query, param, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// Search query validation
const validateSearchQuery = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Query must be between 1 and 200 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('size')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Size must be between 1 and 100'),
  query('category')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Category must not be empty'),
  query('brand')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Brand must not be empty'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min price must be a positive number'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max price must be a positive number'),
  handleValidationErrors,
];

// Autocomplete validation
const validateAutocompleteQuery = [
  query('prefix')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Prefix must be between 1 and 50 characters'),
  handleValidationErrors,
];

module.exports = {
  validateSearchQuery,
  validateAutocompleteQuery,
  handleValidationErrors,
};

