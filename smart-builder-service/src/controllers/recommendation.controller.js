const recommendationService = require("../services/recommendation.service");
const buildSuggestionsService = require("../services/buildSuggestions.service");
const { ValidationError } = require("../errors");
const recommendationConfig = require("../utils/recommendation-config");
const { flushCache } = require("../utils/cache");
const logger = require("../utils/logger");

/**
 * Get compatible component recommendations
 * GET /api/v1/recommendations/compatible?componentType=motherboard&currentComponents=...
 */
const getCompatibleRecommendations = async (req, res, next) => {
  try {
    const { componentType, currentComponents, buildId } = req.query;

    let components = [];
    if (currentComponents) {
      try {
        components = JSON.parse(currentComponents);
      } catch (error) {
        return next(
          new ValidationError("currentComponents phải là JSON hợp lệ")
        );
      }
    }

    const recommendations =
      await recommendationService.getCompatibleRecommendations({
        componentType,
        currentComponents: components,
        buildId,
      });

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get build suggestions for missing components
 * POST /api/v1/recommendations/build-suggestions
 * Body: { currentConfig: {}, categoryId: "categoryId123" }
 */
const getBuildSuggestions = async (req, res, next) => {
  try {
    const { currentConfig = {}, categoryId } = req.body;

    if (!categoryId || typeof categoryId !== 'string') {
      return next(
        new ValidationError("categoryId là bắt buộc và phải là string")
      );
    }

    const suggestions = await buildSuggestionsService.getBuildSuggestions({
      currentConfig,
      categoryId,
      limitPerComponent: Math.min(6, recommendationConfig.DEFAULT_LIMITS.COMPATIBLE_PRODUCTS),
    });

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get favorite products
 * GET /api/v1/recommendations/favorites?userId=...&timeWindow=30&limit=20
 */
const getFavoriteProducts = async (req, res, next) => {
  try {
    const {
      userId,
      timeWindow = recommendationConfig.TIME_WINDOWS.FAVORITE_PRODUCTS_DAYS,
      limit = recommendationConfig.DEFAULT_LIMITS.FAVORITE_PRODUCTS,
      category,
    } = req.query;

    if (!userId) {
      return next(new ValidationError("userId là bắt buộc"));
    }

    const favorites = await recommendationService.getFavoriteProducts({
      userId,
      timeWindow: parseInt(timeWindow),
      limit: parseInt(limit),
      category,
    });

    res.json({
      success: true,
      data: favorites,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get similar products
 * GET /api/v1/recommendations/similar?productId=...&limit=10
 */
const getSimilarProducts = async (req, res, next) => {
  try {
    const {
      productId,
      limit = recommendationConfig.DEFAULT_LIMITS.SIMILAR_PRODUCTS,
      category,
    } = req.query;

    const similar = await recommendationService.getSimilarProducts({
      productId,
      limit: parseInt(limit),
      category,
    });

    res.json({
      success: true,
      data: similar,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get personalized recommendations
 * GET /api/v1/recommendations/personalized?userId=...&componentType=CPU&strategy=hybrid
 */
const getPersonalizedRecommendations = async (req, res, next) => {
  try {
    const {
      userId,
      componentType,
      limit = recommendationConfig.DEFAULT_LIMITS.PERSONALIZED_RECOMMENDATIONS,
      strategy = recommendationConfig.STRATEGIES.DEFAULT,
    } = req.query;
    const recommendations =
      await recommendationService.getPersonalizedRecommendations({
        userId,
        componentType,
        limit: parseInt(limit),
        strategy,
      });
    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear cache
 * POST /api/v1/recommendations/clear-cache
 * Body: { pattern: "compatible:*" } (optional, if not provided, flush all)
 */
const clearCache = async (req, res, next) => {
  try {
    const { pattern } = req.body;
    
    logger.info('[RecommendationController] Clearing cache', { pattern: pattern || 'all' });
    
    const result = await flushCache(pattern);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to clear cache',
        error: result.error || 'Unknown error'
      });
    }
    
    res.json({
      success: true,
      message: pattern 
        ? `Cleared cache matching pattern: ${pattern}` 
        : 'All cache cleared',
      data: {
        deletedCount: result.deletedCount,
        pattern: result.pattern
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCompatibleRecommendations,
  getFavoriteProducts,
  getSimilarProducts,
  getPersonalizedRecommendations,
  getBuildSuggestions,
  clearCache,
};
