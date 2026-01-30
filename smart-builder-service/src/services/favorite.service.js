const identityClient = require("../clients/identity.client");
const productClient = require("../clients/product.client");
const { calculateFavoriteScore } = require("../utils/scoring");
const { getCache, setCache, getRecommendationKey } = require("../utils/cache");
const RecommendationCache = require("../models/recommendationCache.model");
const recommendationConfig = require("../utils/recommendation-config");
const logger = require("../utils/logger");

/**
 * Get favorite products based on user behavior
 */
class FavoriteService {
  async getFavoriteProducts(options) {
    const {
      userId,
      timeWindow = recommendationConfig.TIME_WINDOWS.FAVORITE_PRODUCTS_DAYS,
      limit = recommendationConfig.DEFAULT_LIMITS.FAVORITE_PRODUCTS,
      category,
    } = options;
    logger.info("[FavoriteService] Starting favorite products", {
      userId,
      timeWindow,
      limit,
      category,
    });

    if (!userId) {
      throw new Error("userId là bắt buộc");
    }

    // Check cache
    const cacheKey = getRecommendationKey(userId, "favorites", category);
    logger.debug("[FavoriteService] Checking cache", { cacheKey });
    const cached = await getCache(cacheKey);
    if (cached) {
      logger.info("[FavoriteService] Cache hit, returning cached results", {
        cacheKey,
        count: cached.favorites?.length || 0,
      });
      return cached;
    }
    logger.debug("[FavoriteService] Cache miss, proceeding with calculation");

    // Get behavior data
    logger.debug(
      "[FavoriteService] Fetching behavior data from Identity Service",
      {
        userId,
      }
    );
    const behaviorStartTime = Date.now();
    const behaviorData = await identityClient.getUserBehavior(userId, {
      limit: recommendationConfig.BEHAVIOR.MAX_EVENTS_LIMIT,
    });
    const behaviorDuration = Date.now() - behaviorStartTime;

    const events = behaviorData.events || [];
    logger.info("[FavoriteService] Fetched behavior data", {
      totalEvents: events.length,
      duration: `${behaviorDuration}ms`,
    });

    // Filter by time window
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeWindow);
    const recentEvents = events.filter(
      (event) => new Date(event.timestamp) >= cutoffDate
    );
    logger.debug("[FavoriteService] Filtered events by time window", {
      totalEvents: events.length,
      recentEvents: recentEvents.length,
      cutoffDate: cutoffDate.toISOString(),
    });

    // Group by product and calculate scores
    const productScores = new Map();

    logger.debug("[FavoriteService] Grouping events by product");
    for (const event of recentEvents) {
      if (event.entityType !== "product" || !event.entityId) continue;

      const productId = event.entityId;
      if (!productScores.has(productId)) {
        productScores.set(productId, {
          productId,
          interactions: {
            views: 0,
            clicks: 0,
            addToCart: 0,
            purchase: 0,
          },
          timestamps: [],
        });
      }

      const product = productScores.get(productId);
      const eventType = event.eventType;

      if (eventType === "view") product.interactions.views++;
      else if (eventType === "click") product.interactions.clicks++;
      else if (eventType === "add_to_cart") product.interactions.addToCart++;
      else if (eventType === "remove_from_cart") {
        // Track removals - if removed multiple times, reduce score significantly
        if (!product.interactions.removeFromCart) {
          product.interactions.removeFromCart = 0;
        }
        product.interactions.removeFromCart++;
      } else if (eventType === "purchase") product.interactions.purchase++;

      product.timestamps.push(new Date(event.timestamp));
    }

    logger.info("[FavoriteService] Grouped events by product", {
      uniqueProducts: productScores.size,
    });

    // Calculate scores and get product details
    const favorites = [];
    let skippedCount = 0;
    let excludedCount = 0;

    logger.debug("[FavoriteService] Calculating scores for products", {
      totalProducts: productScores.size,
    });

    for (const [productId, data] of productScores.entries()) {
      try {
        // Use lightweight product for calculations
        const product = await productClient.getLightweightProduct(productId);
        if (
          !product ||
          product.status !==
            recommendationConfig.PRODUCT_FILTERING.REQUIRED_STATUS ||
          product.isActive !==
            recommendationConfig.PRODUCT_FILTERING.REQUIRED_ACTIVE
        ) {
          skippedCount++;
          logger.debug(
            "[FavoriteService] Product skipped (not published/inactive)",
            {
              productId,
              status: product?.status,
              isActive: product?.isActive,
            }
          );
          continue;
        }

        if (category && product.categoryId?.toString() !== category) {
          skippedCount++;
          logger.debug(
            "[FavoriteService] Product skipped (category mismatch)",
            {
              productId,
              productCategory: product.categoryId?.toString(),
              requestedCategory: category,
            }
          );
          continue;
        }

        // Skip products that have been removed from cart multiple times (user doesn't want them)
        const removeCount = data.interactions.removeFromCart || 0;
        const addToCartCount = data.interactions.addToCart || 0;

        // If removed more times than added, or removed multiple times, exclude from favorites
        if (
          removeCount >= recommendationConfig.FAVORITE.MAX_REMOVE_COUNT ||
          (removeCount > addToCartCount &&
            removeCount >= recommendationConfig.FAVORITE.REMOVE_THRESHOLD)
        ) {
          excludedCount++;
          logger.debug(
            "[FavoriteService] Product excluded (removed multiple times)",
            {
              productId,
              removeCount,
              addToCartCount,
            }
          );
          continue;
        }

        const lastInteraction = new Date(
          Math.max(...data.timestamps.map((t) => new Date(t)))
        );
        let score = calculateFavoriteScore(
          data.interactions,
          lastInteraction,
          timeWindow
        );

        logger.debug("[FavoriteService] Initial score calculated", {
          productId,
          interactions: data.interactions,
          initialScore: score,
          lastInteraction: lastInteraction.toISOString(),
        });

        // Reduce score based on remove_from_cart events
        if (removeCount > 0) {
          // Penalty: reduce score by configured percentage per removal
          const maxPenalty = 0.6; // Max 60% reduction
          const penalty = Math.min(
            removeCount *
              recommendationConfig.FAVORITE.REMOVE_PENALTY_PER_EVENT,
            maxPenalty
          );
          const beforePenalty = score;
          score = score * (1 - penalty);
          logger.debug("[FavoriteService] Applied removal penalty", {
            productId,
            removeCount,
            penalty,
            beforePenalty,
            afterPenalty: score,
          });
        }

        // Only include if score is still positive
        if (score <= 0) {
          excludedCount++;
          logger.debug("[FavoriteService] Product excluded (score <= 0)", {
            productId,
            score,
          });
          continue;
        }

        favorites.push({
          productId: product._id,
          product,
          score,
          interactions: data.interactions,
          lastInteraction: lastInteraction.toISOString(),
          category: product.categoryId,
          reason: this.generateReason(
            data.interactions,
            lastInteraction,
            timeWindow
          ),
          categoryId: product.categoryId,
        });

        logger.debug("[FavoriteService] Product added to favorites", {
          productId,
          score,
          interactions: data.interactions,
        });
      } catch (error) {
        logger.error("[FavoriteService] Error fetching product", {
          productId,
          error: error.message,
        });
        continue;
      }
    }

    logger.info("[FavoriteService] Scoring completed", {
      totalProducts: productScores.size,
      skippedCount,
      excludedCount,
      favoritesCount: favorites.length,
    });

    // Sort by score and limit
    favorites.sort((a, b) => b.score - a.score);
    const topFavorites = favorites.slice(0, limit);

    // Fetch full product data only for final results
    logger.debug("[FavoriteService] Fetching full product data for final results", {
      count: topFavorites.length
    });
    const enrichStartTime = Date.now();
    
    const enrichedFavorites = await Promise.all(
      topFavorites.map(async (fav) => {
        try {
          const fullProduct = await productClient.getProduct(fav.productId.toString());
          return {
            ...fav,
            product: fullProduct || fav.product, // Use full product if available
          };
        } catch (error) {
          logger.warn("[FavoriteService] Failed to fetch full product, using lightweight", {
            productId: fav.productId,
            error: error.message
          });
          return fav; // Keep lightweight product if full fetch fails
        }
      })
    );
    
    const enrichDuration = Date.now() - enrichStartTime;
    logger.info("[FavoriteService] Enriched favorites with full product data", {
      count: enrichedFavorites.length,
      duration: `${enrichDuration}ms`
    });

    logger.debug("[FavoriteService] Sorted and limited favorites", {
      beforeLimit: favorites.length,
      afterLimit: topFavorites.length,
      topScores: topFavorites.slice(0, 5).map((f) => ({
        productId: f.productId?.toString(),
        score: f.score,
      })),
    });

    // Group by category (after enrichment)
    const byCategory = {};
    for (const favorite of enrichedFavorites) {
      const catId = favorite.category?.toString() || "other";
      if (!byCategory[catId]) {
        byCategory[catId] = [];
      }
      byCategory[catId].push(favorite);
    }

    logger.debug("[FavoriteService] Grouped by category", {
      categories: Object.keys(byCategory),
      countsByCategory: Object.fromEntries(
        Object.entries(byCategory).map(([cat, items]) => [cat, items.length])
      ),
    });

    const result = {
      favorites: enrichedFavorites,
      byCategory,
      timeWindow,
    };

    // Cache result
    logger.debug("[FavoriteService] Caching result", { cacheKey });
    await setCache(cacheKey, result);

    logger.info("[FavoriteService] Returning favorite products", {
      totalFavorites: topFavorites.length,
      categories: Object.keys(byCategory).length,
    });

    return result;
  }

  generateReason(interactions, lastInteraction, timeWindow) {
    const daysAgo = Math.floor(
      (new Date() - new Date(lastInteraction)) / (1000 * 60 * 60 * 24)
    );
    const totalInteractions = Object.values(interactions).reduce(
      (sum, val) => sum + val,
      0
    );

    if (interactions.purchase > 0) {
      return `Bạn đã mua sản phẩm này ${interactions.purchase} lần`;
    }
    if (
      interactions.addToCart > 0 &&
      (!interactions.removeFromCart ||
        interactions.addToCart > interactions.removeFromCart)
    ) {
      return `Bạn đã thêm vào giỏ hàng ${interactions.addToCart} lần`;
    }
    if (interactions.clicks > 0) {
      return `Bạn đã click vào sản phẩm này ${interactions.clicks} lần`;
    }
    if (totalInteractions > 0) {
      return `Bạn đã xem sản phẩm này ${totalInteractions} lần${
        daysAgo > 0 ? ` trong ${daysAgo} ngày qua` : " gần đây"
      }`;
    }
    return "Sản phẩm bạn đã quan tâm";
  }
}

module.exports = new FavoriteService();
