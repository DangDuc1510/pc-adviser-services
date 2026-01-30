/**
 * Optimization Configuration
 * Cấu hình cho các tính năng tối ưu hóa recommendation system
 * 
 * File này cho phép bạn dễ dàng điều chỉnh các thông số để optimize performance
 */

module.exports = {
  // ============================================
  // ELASTICSEARCH CONFIGURATION
  // ============================================
  ELASTICSEARCH: {
    // Enable/disable Elasticsearch retrieval stage
    // Nếu false, sẽ fallback về cách cũ (fetch all products)
    ENABLED: true,

    // Index name trong Elasticsearch
    INDEX_NAME: 'products',

    // Số lượng candidates tối đa để retrieve từ Elasticsearch
    CANDIDATES_LIMIT: 30,

    // Minimum candidates để trigger ranking stage
    // Nếu số candidates < MIN_CANDIDATES, sẽ fetch thêm từ product service
    MIN_CANDIDATES: 5,

    // Timeout cho Elasticsearch queries (ms)
    TIMEOUT: 5000,

    // Enable fallback nếu Elasticsearch fails
    FALLBACK_ON_ERROR: true,
  },

  // ============================================
  // TWO-STAGE ARCHITECTURE CONFIG
  // ============================================
  TWO_STAGE: {
    // Enable two-stage architecture (Retrieval + Ranking)
    ENABLED: true,

    // Stage 1: Retrieval configuration
    RETRIEVAL: {
      // Số lượng candidates để retrieve trong stage 1
      CANDIDATES_LIMIT: 30,

      // Boost score cho các products match user preferences
      USER_PREFERENCE_BOOST: 1.5,

      // Boost score cho compatibility matches
      COMPATIBILITY_BOOST: 2.0,
    },

    // Stage 2: Ranking configuration
    RANKING: {
      // Số lượng products để rank trong stage 2
      RANKING_LIMIT: 30,

      // Enable early exit nếu đã có đủ good recommendations
      EARLY_EXIT_ENABLED: true,

      // Threshold để early exit (số lượng recommendations tốt)
      EARLY_EXIT_THRESHOLD_MULTIPLIER: 3, // 3x target limit
    },
  },

  // ============================================
  // BATCH PROCESSING CONFIG
  // ============================================
  BATCH: {
    // Batch size khi process products
    SIZE: 50,

    // Enable parallel processing trong batch
    PARALLEL: true,

    // Max concurrent batches
    MAX_CONCURRENT_BATCHES: 5,
  },

  // ============================================
  // CACHE CONFIGURATION
  // ============================================
  CACHE: {
    // Cache TTL cho retrieval results (seconds)
    RETRIEVAL_TTL: 300, // 5 minutes

    // Cache TTL cho final recommendations (seconds)
    RECOMMENDATIONS_TTL: 900, // 15 minutes

    // Cache TTL cho product pool (seconds)
    PRODUCT_POOL_TTL: 3600, // 1 hour

    // Enable cache warming (pre-populate cache)
    WARMING_ENABLED: false,

    // Cache warming schedule (cron format)
    WARMING_SCHEDULE: '0 */6 * * *', // Every 6 hours
  },

  // ============================================
  // PERFORMANCE THRESHOLDS
  // ============================================
  PERFORMANCE: {
    // Target latency cho retrieval stage (ms)
    RETRIEVAL_TARGET_MS: 50,

    // Target latency cho ranking stage (ms)
    RANKING_TARGET_MS: 100,

    // Target latency cho total request (ms)
    TOTAL_TARGET_MS: 150,

    // Alert nếu latency vượt quá threshold này (ms)
    ALERT_THRESHOLD_MS: 500,
  },

  // ============================================
  // FALLBACK CONFIGURATION
  // ============================================
  FALLBACK: {
    // Enable fallback nếu Elasticsearch fails
    ENABLED: true,

    // Fallback strategy: 'product-service' hoặc 'cache-only'
    STRATEGY: 'product-service',

    // Max retries trước khi fallback
    MAX_RETRIES: 2,

    // Retry delay (ms)
    RETRY_DELAY: 1000,
  },

  // ============================================
  // MONITORING & LOGGING
  // ============================================
  MONITORING: {
    // Enable performance metrics logging
    ENABLED: true,

    // Log level: 'debug', 'info', 'warn', 'error'
    LOG_LEVEL: 'info',

    // Log retrieval stage metrics
    LOG_RETRIEVAL: true,

    // Log ranking stage metrics
    LOG_RANKING: true,

    // Log cache hit/miss rates
    LOG_CACHE: true,
  },

  // ============================================
  // FEATURE FLAGS
  // ============================================
  FEATURES: {
    // Enable Elasticsearch retrieval
    ELASTICSEARCH_RETRIEVAL: true,

    // Enable two-stage architecture
    TWO_STAGE_ARCHITECTURE: true,

    // Enable batch processing
    BATCH_PROCESSING: true,

    // Enable early exit optimization
    EARLY_EXIT: true,

    // Enable pre-computation (future)
    PRE_COMPUTATION: false,

    // Enable vector search (future - Phase 2)
    VECTOR_SEARCH: false,
  },
};
