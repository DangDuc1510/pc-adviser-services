const searchClient = require('../clients/search.client');
const optimizationConfig = require('../utils/optimization-config');
const logger = require('../utils/logger');
const { productMatchesComponentType } = require('../utils/componentMapping');

/**
 * Retrieval Service - Stage 1 of Two-Stage Architecture
 * Fast retrieval using Elasticsearch to filter candidates
 */
class RetrievalService {
  constructor() {
    this.config = optimizationConfig.ELASTICSEARCH;
    this.twoStageConfig = optimizationConfig.TWO_STAGE;
  }

  /**
   * Retrieve candidates from Elasticsearch based on filters
   * @param {Object} options - Retrieval options
   * @param {String} options.componentType - Component type to filter
   * @param {Object} options.requirements - Compatibility requirements
   * @param {Object} options.userPreferences - User preferences for boosting
   * @param {Number} options.limit - Number of candidates to retrieve
   * @returns {Promise<Array>} Array of candidate products
   */
  async retrieveCandidates(options) {
    const {
      componentType,
      requirements = {},
      userPreferences = {},
      limit = this.config.CANDIDATES_LIMIT,
    } = options;

    const startTime = Date.now();

    // Check if retrieval is enabled
    if (!optimizationConfig.FEATURES.ELASTICSEARCH_RETRIEVAL) {
      logger.debug('[RetrievalService] Retrieval disabled, skipping');
      return [];
    }

    try {
      logger.debug('[RetrievalService] Calling search-service for candidates', {
        componentType,
        candidatesLimit: limit,
        requirements: Object.keys(requirements),
      });

      // Call search-service API thay vì connect trực tiếp đến Elasticsearch
      const products = await searchClient.filterByCompatibility({
        componentType,
        requirements,
        userPreferences,
        limit,
      });

      const duration = Date.now() - startTime;
      logger.info('[RetrievalService] Retrieved candidates from search-service', {
        componentType,
        candidatesCount: products.length,
        duration: `${duration}ms`,
      });

      // Log performance metrics
      if (optimizationConfig.MONITORING.LOG_RETRIEVAL) {
        const targetMs = optimizationConfig.PERFORMANCE.RETRIEVAL_TARGET_MS;
        if (duration > targetMs) {
          logger.warn('[RetrievalService] Retrieval exceeded target latency', {
            duration,
            target: targetMs,
          });
        }
      }

      // Transform products to candidates format
      const candidates = products.map((product) => ({
        _id: product.id || product._id,
        productId: product.id || product._id,
        name: product.name,
        brandId: product.brandId,
        categoryId: product.categoryId,
        pricing: {
          salePrice: product.price,
          originalPrice: product.originalPrice || product.price,
        },
        specifications: product.specifications || {},
        colors: product.colors || [],
        views: product.popularity || 0,
        status: product.status,
        isActive: product.status === 'active',
        _score: product._score || 0,
      }));

      return candidates;
    } catch (error) {
      logger.error('[RetrievalService] Error retrieving candidates', {
        error: error.message,
        componentType,
        stack: error.stack,
      });

      // Fallback if enabled
      if (optimizationConfig.FALLBACK.ENABLED) {
        logger.info('[RetrievalService] Falling back to product service');
        return [];
      }

      throw error;
    }
  }

  /**
   * Build query parameters for search-service API
   * @param {String} componentType - Component type
   * @param {Object} requirements - Compatibility requirements
   * @param {Object} userPreferences - User preferences
   * @returns {Object} Query parameters
   */
  buildQuery(componentType, requirements, userPreferences) {
    const must = [
      { term: { status: 'published' } },
      { term: { isActive: true } },
    ];

    const filter = [];
    const should = [];

    // Component type filter (if we have componentType field in index)
    // Note: This might need to be adjusted based on your Elasticsearch index structure
    // For now, we'll filter in application code if needed

    // Compatibility requirements - MUST match
    if (requirements.socket) {
      filter.push({
        term: { 'specifications.socket': requirements.socket },
      });
    }

    if (requirements.ramType) {
      filter.push({
        term: { 'specifications.ramTypes': requirements.ramType },
      });
    }

    if (requirements.formFactor) {
      filter.push({
        term: { 'specifications.supportedFormFactors': requirements.formFactor },
      });
    }

    if (requirements.powerRequirement > 0) {
      filter.push({
        range: {
          'specifications.wattage': { gte: requirements.powerRequirement },
        },
      });
    }

    // Price range filter
    if (requirements.budgetMin || requirements.budgetMax) {
      filter.push({
        range: {
          'pricing.salePrice': {
            ...(requirements.budgetMin && { gte: requirements.budgetMin }),
            ...(requirements.budgetMax && { lte: requirements.budgetMax }),
          },
        },
      });
    }

    // User preferences - SHOULD match (boost score)
    const boost = this.twoStageConfig.RETRIEVAL.USER_PREFERENCE_BOOST;
    if (userPreferences.brands && userPreferences.brands.size > 0) {
      should.push({
        terms: {
          brandId: Array.from(userPreferences.brands.keys()),
          boost: boost,
        },
      });
    }

    if (userPreferences.categories && userPreferences.categories.size > 0) {
      should.push({
        terms: {
          categoryId: Array.from(userPreferences.categories.keys()),
          boost: boost,
        },
      });
    }

    // Compatibility boost
    const compatibilityBoost = this.twoStageConfig.RETRIEVAL.COMPATIBILITY_BOOST;
    if (requirements.socket || requirements.ramType || requirements.formFactor) {
      // Products matching compatibility requirements get boost
      should.push({
        bool: {
          must: filter.filter((f) =>
            f.term && (
              f.term['specifications.socket'] ||
              f.term['specifications.ramTypes'] ||
              f.term['specifications.supportedFormFactors']
            )
          ),
          boost: compatibilityBoost,
        },
      });
    }

    return {
      bool: {
        must: must.length > 0 ? must : undefined,
        filter: filter.length > 0 ? filter : undefined,
        should: should.length > 0 ? should : undefined,
        minimum_should_match: should.length > 0 ? 0 : undefined,
      },
    };
  }

  /**
   * Transform Elasticsearch results to product format
   * @param {Array} candidates - Elasticsearch results
   * @param {String} componentType - Component type for filtering
   * @returns {Array} Transformed products
   */
  transformCandidates(candidates, componentType) {
    return candidates
      .map((candidate) => {
        // Transform Elasticsearch document to product format
        const product = {
          _id: candidate._id || candidate.productId,
          productId: candidate._id || candidate.productId,
          name: candidate.name,
          brandId: candidate.brandId,
          categoryId: candidate.categoryId,
          pricing: candidate.pricing || {},
          specifications: candidate.specifications || {},
          colors: candidate.colors || [],
          views: candidate.views || 0,
          status: candidate.status,
          isActive: candidate.isActive,
          _elasticsearchScore: candidate._score,
        };

        // Filter by component type if needed (if not filtered in ES)
        if (componentType && !productMatchesComponentType(product, componentType)) {
          return null;
        }

        return product;
      })
      .filter((p) => p !== null);
  }
}

module.exports = new RetrievalService();
