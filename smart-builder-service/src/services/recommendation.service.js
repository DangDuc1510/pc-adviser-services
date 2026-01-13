const favoriteService = require("./favorite.service");
const similarityService = require("./similarity.service");
const compatibilityService = require("./compatibility.service");
const collaborativeService = require("./collaborative.service");
const contentBasedService = require("./contentBased.service");
const recommendationConfig = require("../utils/recommendation-config");
const logger = require("../utils/logger");

/**
 * Main recommendation service that orchestrates other services
 */
class RecommendationService {
  async getCompatibleRecommendations(options) {
    logger.info("[RecommendationService] Starting compatible recommendations", {
      options,
    });
    const startTime = Date.now();
    try {
      const result = await compatibilityService.getCompatibleRecommendations(
        options
      );
      const duration = Date.now() - startTime;
      logger.info(
        "[RecommendationService] Compatible recommendations completed",
        {
          duration: `${duration}ms`,
          componentType: result.componentType,
          count: result.recommendations?.length || 0,
        }
      );
      return result;
    } catch (error) {
      logger.error(
        "[RecommendationService] Error in compatible recommendations",
        {
          error: error.message,
          options,
        }
      );
      throw error;
    }
  }

  async getFavoriteProducts(options) {
    logger.info("[RecommendationService] Starting favorite products", {
      options,
    });
    const startTime = Date.now();
    try {
      const result = await favoriteService.getFavoriteProducts(options);
      const duration = Date.now() - startTime;
      logger.info("[RecommendationService] Favorite products completed", {
        duration: `${duration}ms`,
        count: result.favorites?.length || 0,
        timeWindow: result.timeWindow,
      });
      return result;
    } catch (error) {
      logger.error("[RecommendationService] Error in favorite products", {
        error: error.message,
        options,
      });
      throw error;
    }
  }

  async getSimilarProducts(options) {
    logger.info("[RecommendationService] Starting similar products", {
      options,
    });
    const startTime = Date.now();
    try {
      const result = await similarityService.getSimilarProducts(options);
      const duration = Date.now() - startTime;
      logger.info("[RecommendationService] Similar products completed", {
        duration: `${duration}ms`,
        productId: options.productId,
        count: result.similarProducts?.length || 0,
      });
      return result;
    } catch (error) {
      logger.error("[RecommendationService] Error in similar products", {
        error: error.message,
        options,
      });
      throw error;
    }
  }

  async getPersonalizedRecommendations(options) {
    const { strategy = recommendationConfig.STRATEGIES.DEFAULT, ...rest } =
      options;
    const startTime = Date.now();

    try {
      let result;
      if (strategy === "collaborative") {
        result = await collaborativeService.getRecommendations(rest);
      } else if (strategy === "content") {
        result = await contentBasedService.getRecommendations(rest);
      } else {
        // Hybrid strategy (default)
        result = await this.getHybridRecommendations(rest);
      }

      const duration = Date.now() - startTime;
      logger.info(
        "[RecommendationService] Personalized recommendations completed",
        {
          duration: `${duration}ms`,
          strategy: result.strategy || strategy,
          count: result.recommendations?.length || 0,
        }
      );
      return result;
    } catch (error) {
      logger.error(
        "[RecommendationService] Error in personalized recommendations",
        {
          error: error.message,
          strategy,
          options: rest,
        }
      );
      throw error;
    }
  }

  async getHybridRecommendations(options) {
    const startTime = Date.now();

    const [collaborativeResults, contentResults] = await Promise.all([
      collaborativeService.getRecommendations(options).catch((error) => {
        logger.warn(
          "[RecommendationService] Collaborative filtering failed, using empty results",
          {
            error: error.message,
          }
        );
        return recommendationConfig.ERROR_HANDLING.USE_EMPTY_ON_ERROR
          ? { recommendations: [] }
          : Promise.reject(error);
      }),
      contentBasedService.getRecommendations(options).catch((error) => {
        logger.warn(
          "[RecommendationService] Content-based filtering failed, using empty results",
          {
            error: error.message,
          }
        );
        return recommendationConfig.ERROR_HANDLING.USE_EMPTY_ON_ERROR
          ? { recommendations: [] }
          : Promise.reject(error);
      }),
    ]);

    logger.debug("[RecommendationService] Hybrid - combining results", {
      collaborativeCount: collaborativeResults.recommendations?.length || 0,
      contentBasedCount: contentResults.recommendations?.length || 0,
    });

    // Combine results with configured weights
    const combined = this.combineRecommendations(
      collaborativeResults.recommendations || [],
      contentResults.recommendations || [],
      recommendationConfig.HYBRID.COLLABORATIVE_WEIGHT,
      recommendationConfig.HYBRID.CONTENT_WEIGHT
    );

    const duration = Date.now() - startTime;
    logger.info("[RecommendationService] Hybrid recommendations combined", {
      duration: `${duration}ms`,
      finalCount: combined.length,
      breakdown: {
        collaborative: collaborativeResults.recommendations?.length || 0,
        contentBased: contentResults.recommendations?.length || 0,
      },
    });

    return {
      recommendations: combined,
      userProfile: contentResults.userProfile || {},
      strategy: "hybrid",
      breakdown: {
        collaborative: collaborativeResults.recommendations?.length || 0,
        contentBased: contentResults.recommendations?.length || 0,
      },
    };
  }

  combineRecommendations(
    collaborativeRecs,
    contentRecs,
    collaborativeWeight,
    contentWeight
  ) {
    logger.debug("[RecommendationService] Combining recommendations", {
      collaborativeCount: collaborativeRecs.length,
      contentBasedCount: contentRecs.length,
      collaborativeWeight,
      contentWeight,
    });

    const productMap = new Map();

    // Add collaborative recommendations
    collaborativeRecs.forEach((rec) => {
      const existing = productMap.get(rec.productId.toString());
      if (existing) {
        const oldScore = existing.score;
        existing.score =
          existing.score * collaborativeWeight +
          rec.score * collaborativeWeight;
        existing.reasons = [...existing.reasons, ...(rec.reasons || [])];
        logger.debug(
          "[RecommendationService] Merged collaborative recommendation",
          {
            productId: rec.productId.toString(),
            oldScore,
            newScore: existing.score,
          }
        );
      } else {
        productMap.set(rec.productId.toString(), {
          ...rec,
          score: rec.score * collaborativeWeight,
        });
      }
    });

    // Add content-based recommendations
    contentRecs.forEach((rec) => {
      const existing = productMap.get(rec.productId.toString());
      if (existing) {
        const oldScore = existing.score;
        existing.score = existing.score + rec.score * contentWeight;
        existing.reasons = [...existing.reasons, ...(rec.reasons || [])];
        logger.debug(
          "[RecommendationService] Merged content-based recommendation",
          {
            productId: rec.productId.toString(),
            oldScore,
            newScore: existing.score,
          }
        );
      } else {
        productMap.set(rec.productId.toString(), {
          ...rec,
          score: rec.score * contentWeight,
        });
      }
    });

    // Sort by score and return
    const sorted = Array.from(productMap.values())
      .sort((a, b) => b.score - a.score)
      .map((rec) => ({
        ...rec,
        reasons: [...new Set(rec.reasons)], // Remove duplicates
      }));

    logger.debug("[RecommendationService] Combined recommendations sorted", {
      totalProducts: sorted.length,
      topScore: sorted[0]?.score || 0,
    });

    return sorted;
  }
}

module.exports = new RecommendationService();
