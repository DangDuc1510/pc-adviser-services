/**
 * Generate correlation ID for request tracking
 */
const generateCorrelationId = () => {
  return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Sanitize error message for production
 */
const sanitizeError = (error, isProduction = false) => {
  if (isProduction) {
    return 'An error occurred. Please contact support.';
  }
  return error.message || 'Unknown error';
};

/**
 * Paginate query results
 */
const paginate = (data, page, limit) => {
  const total = data.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const items = data.slice(startIndex, endIndex);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

/**
 * Format date range for queries
 */
const formatDateRange = (startDate, endDate) => {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (end) {
    // Set to end of day
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};

/**
 * Build sort object for queries
 */
const buildSort = (sortBy, sortOrder) => {
  const order = sortOrder === 'asc' ? 1 : -1;
  return { [sortBy]: order };
};

module.exports = {
  generateCorrelationId,
  sanitizeError,
  paginate,
  formatDateRange,
  buildSort,
};

