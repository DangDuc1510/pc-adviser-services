const productClient = require('../clients/product.client');
const retrievalService = require('./retrieval.service');
const { calculateCompatibilityScore, calculatePriceScore, calculateBrandScore, calculateFinalScore } = require('../utils/scoring');
const { productMatchesComponentType, getCategoryNamesForComponent } = require('../utils/componentMapping');
const recommendationConfig = require('../utils/recommendation-config');
const optimizationConfig = require('../utils/optimization-config');
const { getCache, setCache } = require('../utils/cache');
const { getCompatibilityCacheKey, getProductPoolCacheKey, chunkArray } = require('../utils/helpers');
const logger = require('../utils/logger');
const config = require('../config/env');

/**
 * Get compatible component recommendations
 */
class CompatibilityService {
  async getCompatibleRecommendations(options) {
    const { componentType, currentComponents = [], buildId, limit = 10 } = options;
    const startTime = Date.now();
    
    logger.info('[CompatibilityService] Starting compatible recommendations', {
      componentType,
      currentComponentsCount: currentComponents.length,
      buildId,
      limit
    });

    // Extract compatibility requirements from current components
    const requirements = this.extractRequirements(currentComponents);
    logger.debug('[CompatibilityService] Extracted requirements', {
      requirements,
      componentType
    });

    // Check cache for recommendations
    const cacheKey = getCompatibilityCacheKey(componentType, requirements);
    logger.debug('[CompatibilityService] Checking cache', { cacheKey });
    const cached = await getCache(cacheKey);
    if (cached) {
      logger.info('[CompatibilityService] Cache hit, returning cached results', {
        cacheKey,
        count: cached.recommendations?.length || 0,
        duration: `${Date.now() - startTime}ms`
      });
      return {
        ...cached,
        fromCache: true
      };
    }
    logger.debug('[CompatibilityService] Cache miss, proceeding with calculation');

    // TWO-STAGE ARCHITECTURE: Stage 1 - Retrieval
    let products = [];
    const useTwoStage = optimizationConfig.FEATURES.TWO_STAGE_ARCHITECTURE && 
                        optimizationConfig.FEATURES.ELASTICSEARCH_RETRIEVAL;

    if (useTwoStage) {
      logger.info('[CompatibilityService] Using two-stage architecture - Stage 1: Retrieval');
      const retrievalStartTime = Date.now();
      
      // Retrieve candidates from Elasticsearch
      const candidates = await retrievalService.retrieveCandidates({
        componentType,
        requirements,
        limit: optimizationConfig.TWO_STAGE.RETRIEVAL.CANDIDATES_LIMIT,
      });

      const retrievalDuration = Date.now() - retrievalStartTime;
      logger.info('[CompatibilityService] Retrieval stage completed', {
        candidatesCount: candidates.length,
        duration: `${retrievalDuration}ms`,
      });

      // Transform candidates to product format
      products = retrievalService.transformCandidates(candidates, componentType);

      // Fallback to product service if not enough candidates
      if (products.length < optimizationConfig.ELASTICSEARCH.MIN_CANDIDATES) {
        logger.warn('[CompatibilityService] Not enough candidates from Elasticsearch, falling back to product service', {
          candidatesCount: products.length,
          minRequired: optimizationConfig.ELASTICSEARCH.MIN_CANDIDATES,
        });
        products = await this.getProductsForComponentType(componentType);
      }
    } else {
      // OLD APPROACH: Fetch all products
      logger.info('[CompatibilityService] Using legacy approach - fetching all products');
      products = await this.getProductsForComponentType(componentType);
    }
    
    if (products.length === 0) {
      logger.warn('[CompatibilityService] No products found for component type', { componentType });
      return {
        componentType,
        recommendations: [],
        filters: requirements,
        fromCache: false
      };
    }

    // TWO-STAGE ARCHITECTURE: Stage 2 - Ranking
    logger.info('[CompatibilityService] Stage 2: Ranking candidates', {
      productsCount: products.length,
    });

    // Process products in batches for better performance
    const recommendations = await this.processProductsBatch(
      products,
      requirements,
      componentType,
      limit
    );

    // Get top recommendations (still lightweight)
    const topRecommendations = recommendations.slice(0, limit);
    
    // Fetch full product data only for final results
    logger.debug('[CompatibilityService] Fetching full product data for final results', {
      count: topRecommendations.length
    });
    const enrichStartTime = Date.now();
    
    const enrichedRecommendations = await Promise.all(
      topRecommendations.map(async (rec) => {
        try {
          const fullProduct = await productClient.getProduct(rec.productId.toString());
          return {
            ...rec,
            product: fullProduct || rec.product, // Use full product if available, fallback to lightweight
          };
        } catch (error) {
          logger.warn('[CompatibilityService] Failed to fetch full product, using lightweight', {
            productId: rec.productId,
            error: error.message
          });
          return rec; // Keep lightweight product if full fetch fails
        }
      })
    );
    
    const enrichDuration = Date.now() - enrichStartTime;
    logger.info('[CompatibilityService] Enriched recommendations with full product data', {
      count: enrichedRecommendations.length,
      duration: `${enrichDuration}ms`
    });

    const result = {
      componentType,
      recommendations: enrichedRecommendations,
      filters: requirements,
      fromCache: false
    };

    // Cache the result (TTL from config, default 15 minutes)
    const cacheTTL = config.CACHE_TTL_RECOMMENDATIONS || 900;
    await setCache(cacheKey, result, cacheTTL);
    
    const duration = Date.now() - startTime;
    logger.info('[CompatibilityService] Recommendations completed', {
      componentType,
      topCount: result.recommendations.length,
      duration: `${duration}ms`,
      cached: true
    });
    
    return result;
  }

  /**
   * Get products for component type (with caching)
   * @param {String} componentType - Component type
   * @returns {Promise<Array>} Products array
   */
  async getProductsForComponentType(componentType) {
    const poolCacheKey = getProductPoolCacheKey(componentType);
    
    // Check product pool cache (longer TTL - 1 hour)
    const cachedPool = await getCache(poolCacheKey);
    if (cachedPool && Array.isArray(cachedPool)) {
      logger.debug('[CompatibilityService] Product pool cache hit', {
        componentType,
        count: cachedPool.length
      });
      return cachedPool;
    }

    logger.debug('[CompatibilityService] Fetching lightweight products from Product Service', { componentType });
    const fetchStartTime = Date.now();
    
    const filters = {
      status: recommendationConfig.PRODUCT_FILTERING.REQUIRED_STATUS,
      isActive: recommendationConfig.PRODUCT_FILTERING.REQUIRED_ACTIVE,
      limit: recommendationConfig.COMPATIBILITY.PRODUCT_FETCH_LIMIT,
    };

    // Use lightweight API for faster fetching (no images, descriptions, etc.)
    const productsResponse = await productClient.getLightweightProducts(filters);
    const fetchDuration = Date.now() - fetchStartTime;
    let products = Array.isArray(productsResponse) ? productsResponse : (productsResponse.products || []);
    
    // Filter by component type
    if (componentType) {
      const beforeFilter = products.length;
      products = products.filter(product => 
        productMatchesComponentType(product, componentType)
      );
      logger.debug('[CompatibilityService] Filtered by component type', {
        beforeFilter,
        afterFilter: products.length,
        componentType
      });
    }

    logger.info('[CompatibilityService] Fetched products', {
      count: products.length,
      duration: `${fetchDuration}ms`,
      componentType
    });

    // Cache product pool (1 hour TTL)
    if (products.length > 0) {
      await setCache(poolCacheKey, products, 3600);
    }

    return products;
  }

  /**
   * Process products in batches for better performance
   * @param {Array} products - Products to process
   * @param {Object} requirements - Compatibility requirements
   * @param {String} componentType - Component type
   * @param {Number} targetLimit - Target number of recommendations
   * @returns {Promise<Array>} Sorted recommendations
   */
  async processProductsBatch(products, requirements, componentType, targetLimit) {
    const BATCH_SIZE = 50; // Process 50 products at a time
    const EARLY_EXIT_THRESHOLD = targetLimit * 3; // Stop when we have 3x target limit
    
    const recommendations = [];
    let incompatibleCount = 0;
    const batches = chunkArray(products, BATCH_SIZE);
    
    logger.debug('[CompatibilityService] Processing products in batches', {
      totalProducts: products.length,
      batchCount: batches.length,
      batchSize: BATCH_SIZE,
      targetLimit
    });

    for (const batch of batches) {
      // Process batch in parallel
      const batchPromises = batch.map(product => 
        this.scoreProduct(product, requirements, componentType)
      );
      
      const batchResults = await Promise.all(batchPromises);
      
      // Filter out incompatible products and add to recommendations
      for (const result of batchResults) {
        if (result === null) {
          incompatibleCount++;
          continue;
        }
        recommendations.push(result);
      }

      // Early exit optimization: if we have enough good recommendations, stop processing
      if (recommendations.length >= EARLY_EXIT_THRESHOLD) {
        logger.debug('[CompatibilityService] Early exit triggered', {
          recommendationsCount: recommendations.length,
          threshold: EARLY_EXIT_THRESHOLD,
          processedProducts: batches.indexOf(batch) * BATCH_SIZE + batch.length
        });
        break;
      }
    }

    // Sort by score (descending)
    recommendations.sort((a, b) => b.score - a.score);
    
    logger.info('[CompatibilityService] Batch processing completed', {
      totalProducts: products.length,
      incompatibleCount,
      recommendationsCount: recommendations.length,
      topScore: recommendations[0]?.score || 0
    });

    return recommendations;
  }

  /**
   * Score a single product
   * @param {Object} product - Product to score
   * @param {Object} requirements - Compatibility requirements
   * @param {String} componentType - Component type
   * @returns {Object|null} Scored recommendation or null if incompatible
   */
  async scoreProduct(product, requirements, componentType) {
    const compatibility = this.checkCompatibility(product, requirements, componentType);
    const compatibilityScore = calculateCompatibilityScore(compatibility);
    
    if (compatibilityScore === 0) {
      return null; // Incompatible
    }
    
    const scores = {
      compatibility: compatibilityScore,
      price: calculatePriceScore(
        product.pricing?.salePrice || product.pricing?.originalPrice || 0,
        requirements.budgetMin,
        requirements.budgetMax
      ),
      brand: calculateBrandScore(product.brandId?.toString(), requirements.brandPreferences),
      popularity: (product.views || 0) / recommendationConfig.POPULARITY.COMPATIBILITY_NORMALIZATION,
    };
    
    const weights = recommendationConfig.COMPATIBILITY.SCORING_WEIGHTS;
    const finalScore = calculateFinalScore(scores, {
      compatibility: weights.compatibility,
      price: weights.price,
      brand: weights.brand,
      popularity: weights.popularity,
    });
    
    return {
      productId: product._id,
      product,
      score: finalScore,
      compatibility,
      reasons: this.generateReasons(product, compatibility, requirements),
      scores
    };
  }

  extractRequirements(components) {
    logger.debug('[CompatibilityService] Extracting requirements from components', {
      componentsCount: components.length
    });

    const requirements = {
      socket: null,
      ramType: null,
      formFactor: null,
      powerRequirement: 0,
      budgetMin: null,
      budgetMax: null,
      brandPreferences: null
    };

    for (const component of components) {
      const product = component.product || component;
      const specs = product.specifications || {};
      
      // CPU socket requirement for motherboard
      if (specs.socket) {
        requirements.socket = specs.socket;
        logger.debug('[CompatibilityService] Found socket requirement', {
          socket: specs.socket,
          componentType: component.type
        });
      }
      
      // RAM type requirement for motherboard
      if (specs.type && component.type === 'ram') {
        requirements.ramType = specs.type;
        logger.debug('[CompatibilityService] Found RAM type requirement', {
          ramType: specs.type
        });
      }
      
      // Form factor requirement for case
      if (specs.formFactor && component.type === 'motherboard') {
        requirements.formFactor = specs.formFactor;
        logger.debug('[CompatibilityService] Found form factor requirement', {
          formFactor: specs.formFactor
        });
      }
      
      // Power requirement for PSU
      if (specs.powerConsumption || specs.tdp) {
        const power = parseInt(specs.powerConsumption || specs.tdp) || 0;
        requirements.powerRequirement += power;
        logger.debug('[CompatibilityService] Found power requirement', {
          power,
          componentType: component.type,
          totalPower: requirements.powerRequirement
        });
      }
    }

    // Add overhead for power requirement
    if (requirements.powerRequirement > 0) {
      const beforeOverhead = requirements.powerRequirement;
      requirements.powerRequirement = Math.ceil(
        requirements.powerRequirement *
          (1 + recommendationConfig.COMPATIBILITY.POWER_OVERHEAD)
      );
      logger.debug('[CompatibilityService] Applied power overhead', {
        beforeOverhead,
        afterOverhead: requirements.powerRequirement
      });
    }

    logger.info('[CompatibilityService] Requirements extracted', { requirements });
    return requirements;
  }

  checkCompatibility(product, requirements, componentType) {
    const compatibility = {};
    const specs = product.specifications || {};

    // Socket compatibility (for motherboard)
    if (requirements.socket && componentType === 'motherboard') {
      compatibility.socket = specs.socket === requirements.socket ? 'match' : 'mismatch';
    }

    // RAM type compatibility (for motherboard)
    if (requirements.ramType && componentType === 'motherboard') {
      const supportedRamTypes = specs.ramTypes || [];
      compatibility.ramType = supportedRamTypes.includes(requirements.ramType) ? 'match' : 'mismatch';
    }

    // Form factor compatibility (for case)
    if (requirements.formFactor && componentType === 'case') {
      const supportedFormFactors = specs.supportedFormFactors || [];
      compatibility.formFactor = supportedFormFactors.includes(requirements.formFactor) ? 'match' : 'mismatch';
    }

    // Power requirement (for PSU)
    if (requirements.powerRequirement > 0 && componentType === 'psu') {
      const psuWattage = parseInt(specs.wattage || specs.power) || 0;
      compatibility.power = psuWattage >= requirements.powerRequirement ? 'match' : 'mismatch';
    }

    return compatibility;
  }

  generateReasons(product, compatibility, requirements) {
    const reasons = [];
    
    for (const [key, value] of Object.entries(compatibility)) {
      if (value === 'match') {
        if (key === 'socket') {
          reasons.push(`Socket ${product.specifications?.socket} tương thích với CPU đã chọn`);
        } else if (key === 'ramType') {
          reasons.push(`Hỗ trợ ${requirements.ramType} như RAM bạn đã chọn`);
        } else if (key === 'formFactor') {
          reasons.push(`Form factor ${product.specifications?.formFactor} tương thích với motherboard`);
        } else if (key === 'power') {
          reasons.push(`Công suất ${product.specifications?.wattage || product.specifications?.power}W đủ cho build của bạn`);
        }
      }
    }
    
    return reasons;
  }
}

module.exports = new CompatibilityService();

