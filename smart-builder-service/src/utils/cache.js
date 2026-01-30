const { client: redisClient } = require('../config/redis');
const config = require('../config/env');

/**
 * Get value from Redis cache
 * @param {String} key - Cache key
 * @returns {Promise<Object|null>} Cached value or null
 */
async function getCache(key) {
  if (!redisClient || !redisClient.isReady) {
    return null;
  }
  
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/**
 * Set value in Redis cache
 * @param {String} key - Cache key
 * @param {Object} value - Value to cache
 * @param {Number} ttl - Time to live in seconds
 * @returns {Promise<Boolean>} Success status
 */
async function setCache(key, value, ttl = null) {
  if (!redisClient || !redisClient.isReady) {
    return false;
  }
  
  try {
    const ttlToUse = ttl || config.CACHE_TTL_RECOMMENDATIONS;
    await redisClient.setEx(key, ttlToUse, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
}

/**
 * Delete value from Redis cache
 * @param {String} key - Cache key
 * @returns {Promise<Boolean>} Success status
 */
async function deleteCache(key) {
  if (!redisClient || !redisClient.isReady) {
    return false;
  }
  
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error);
    return false;
  }
}

/**
 * Flush all cache or cache matching a pattern
 * @param {String} pattern - Pattern to match (e.g., 'compatible:*', 'build_suggestions:*'). If null, flush all
 * @returns {Promise<Object>} Result with deleted count
 */
async function flushCache(pattern = null) {
  if (!redisClient || !redisClient.isReady) {
    return { success: false, deletedCount: 0, message: 'Redis not available' };
  }
  
  try {
    let deletedCount = 0;
    
    if (pattern) {
      // Use SCAN to find keys matching pattern (non-blocking)
      // Redis client v4+ uses different API
      const keys = [];
      let cursor = 0;
      
      do {
        const result = await redisClient.scan(cursor, {
          MATCH: pattern,
          COUNT: 100
        });
        // Redis client v4+ returns [cursor, keys] array
        if (Array.isArray(result)) {
          cursor = parseInt(result[0]);
          keys.push(...result[1]);
        } else if (result && typeof result === 'object') {
          // Fallback: try to get cursor and keys from result object
          cursor = result.cursor || result[0] || 0;
          const resultKeys = result.keys || result[1] || [];
          keys.push(...resultKeys);
        } else {
          break;
        }
      } while (cursor !== 0);
      
      // Delete keys in batches to avoid blocking
      if (keys.length > 0) {
        // Delete in batches of 100
        const batchSize = 100;
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize);
          const deleted = await redisClient.del(batch);
          deletedCount += deleted;
        }
      }
    } else {
      // Flush all cache
      await redisClient.flushAll();
      deletedCount = -1; // -1 indicates all keys were deleted
    }
    
    return {
      success: true,
      deletedCount: deletedCount,
      pattern: pattern || 'all'
    };
  } catch (error) {
    console.error('Redis flush error:', error);
    return {
      success: false,
      deletedCount: 0,
      error: error.message
    };
  }
}

/**
 * Generate cache key for user preferences
 * @param {String} customerId - Customer ID
 * @returns {String} Cache key
 */
function getUserPreferenceKey(customerId) {
  return `user_pref:${customerId}`;
}

/**
 * Generate cache key for recommendations
 * @param {String} customerId - Customer ID
 * @param {String} type - Recommendation type
 * @param {String} componentType - Component type (optional)
 * @returns {String} Cache key
 */
function getRecommendationKey(customerId, type, componentType = null) {
  const base = `rec:${customerId}:${type}`;
  return componentType ? `${base}:${componentType}` : base;
}

/**
 * Generate cache key for similarity matrix
 * @param {String} type - Matrix type ('user' or 'product')
 * @returns {String} Cache key
 */
function getSimilarityMatrixKey(type) {
  return `similarity_matrix:${type}`;
}

module.exports = {
  getCache,
  setCache,
  deleteCache,
  flushCache,
  getUserPreferenceKey,
  getRecommendationKey,
  getSimilarityMatrixKey
};

