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
  getUserPreferenceKey,
  getRecommendationKey,
  getSimilarityMatrixKey
};

