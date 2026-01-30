/**
 * Helper utility functions
 */

/**
 * Parse JSON safely
 * @param {String} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed value or default
 */
function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Normalize score to 0-100 range
 * @param {Number} score - Raw score
 * @param {Number} min - Minimum possible score
 * @param {Number} max - Maximum possible score
 * @returns {Number} Normalized score (0-100)
 */
function normalizeScore(score, min = 0, max = 100) {
  if (max === min) return 50;
  const normalized = ((score - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

/**
 * Calculate days between two dates
 * @param {Date|String} date1 - First date
 * @param {Date|String} date2 - Second date (default: now)
 * @returns {Number} Number of days
 */
function daysBetween(date1, date2 = new Date()) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get price range category
 * @param {Number} price - Product price
 * @returns {String} Price range category
 */
function getPriceRangeCategory(price) {
  if (price < 5000000) return 'low';
  if (price < 15000000) return 'mid';
  if (price < 30000000) return 'mid-high';
  return 'high';
}

/**
 * Extract product ID from various formats
 * @param {String|Object} productId - Product ID or product object
 * @returns {String|null} Product ID string
 */
function extractProductId(productId) {
  if (!productId) return null;
  if (typeof productId === 'string') return productId;
  if (productId._id) return productId._id.toString();
  if (productId.id) return productId.id.toString();
  return null;
}

/**
 * Chunk array into smaller arrays
 * @param {Array} array - Array to chunk
 * @param {Number} size - Chunk size
 * @returns {Array} Array of chunks
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Sleep/delay function
 * @param {Number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create hash from object for cache keys
 * @param {Object} obj - Object to hash
 * @returns {String} Hash string
 */
function hashObject(obj) {
  const str = JSON.stringify(obj, Object.keys(obj).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate cache key for compatibility recommendations
 * @param {String} componentType - Component type
 * @param {Object} requirements - Compatibility requirements
 * @returns {String} Cache key
 */
function getCompatibilityCacheKey(componentType, requirements) {
  const reqHash = hashObject(requirements);
  return `compatible:${componentType}:${reqHash}`;
}

/**
 * Generate cache key for product pool by component type
 * @param {String} componentType - Component type
 * @returns {String} Cache key
 */
function getProductPoolCacheKey(componentType) {
  return `product_pool:${componentType}`;
}

module.exports = {
  safeJsonParse,
  normalizeScore,
  daysBetween,
  getPriceRangeCategory,
  extractProductId,
  chunkArray,
  sleep,
  hashObject,
  getCompatibilityCacheKey,
  getProductPoolCacheKey
};

