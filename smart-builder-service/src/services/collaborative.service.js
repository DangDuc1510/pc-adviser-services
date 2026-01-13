const identityClient = require("../clients/identity.client");
const productClient = require("../clients/product.client");
const orderClient = require("../clients/order.client");
const { jaccardSimilarity, cosineSimilarity } = require("../utils/similarity");
const { INTERACTION_WEIGHTS } = require("../utils/scoring");
const { productMatchesComponentType } = require("../utils/componentMapping");
const {
  getCache,
  setCache,
  getSimilarityMatrixKey,
} = require("../utils/cache");
const recommendationConfig = require("../utils/recommendation-config");
const config = require("../config/env");
const logger = require("../utils/logger");

/**
 * Collaborative filtering service
 * Finds similar users and recommends products they liked
 */
class CollaborativeService {
  async getRecommendations(options) {
    const {
      userId,
      componentType,
      limit = recommendationConfig.DEFAULT_LIMITS.PERSONALIZED_RECOMMENDATIONS,
    } = options;

    const userBehavior = await identityClient.getUserBehavior(userId, {
      limit: recommendationConfig.COLLABORATIVE.BEHAVIOR_EVENTS_LIMIT,
    });

    const userProducts = this.extractUserProducts(userBehavior.events || []);

    if (userProducts.size === 0) {
      return {
        recommendations: [],
        message:
          recommendationConfig.ERROR_HANDLING.INSUFFICIENT_DATA_COLLABORATIVE,
      };
    }
    const recommendations = await this.getPopularProductsFromSimilarPatterns(
      userProducts,
      componentType,
      limit
    );
    return {
      recommendations,
      strategy: "collaborative",
      message: "Based on popular products among users with similar interests",
    };
  }

  extractUserProducts(events) {
    const productMap = new Map();
    const removedProducts = new Set(); // Track products removed from cart

    // First pass: count removals
    for (const event of events) {
      if (event.entityType !== "product" || !event.entityId) continue;
      if (event.eventType === "remove_from_cart") {
        removedProducts.add(event.entityId);
      }
    }

    // Second pass: calculate scores
    for (const event of events) {
      if (event.entityType !== "product" || !event.entityId) continue;

      const productId = event.entityId;
      const weight = INTERACTION_WEIGHTS[event.eventType] || 0;

      // Skip products that have been removed multiple times
      const removeCount = events.filter(
        (e) => e.entityId === productId && e.eventType === "remove_from_cart"
      ).length;

      // If removed multiple times, exclude completely
      if (removeCount >= recommendationConfig.COLLABORATIVE.MAX_REMOVE_COUNT) {
        productMap.delete(productId);
        continue;
      }

      if (productMap.has(productId)) {
        productMap.set(productId, productMap.get(productId) + weight);
      } else {
        productMap.set(productId, weight);
      }
    }

    // Remove products with negative or zero scores
    for (const [productId, score] of productMap.entries()) {
      if (score <= 0) {
        productMap.delete(productId);
      }
    }

    return productMap;
  }

  async getPopularProductsFromSimilarPatterns(
    userProducts,
    componentType,
    limit
  ) {
    // Strategy: Find products that are frequently bought together with user's products
    // or products that are popular among users who bought similar products

    const userProductIds = Array.from(userProducts.keys());
    const recommendations = new Map(); // productId -> score

    logger.debug("[CollaborativeService] Fetching user product details", {
      userProductIdsCount: userProductIds.length,
      fetchingFirst: Math.min(10, userProductIds.length),
    });

    // Get product details for user's products to understand their preferences
    const userProductDetails = [];
    const productFetchStart = Date.now();
    for (const productId of userProductIds.slice(
      0,
      recommendationConfig.COLLABORATIVE.USER_PRODUCTS_FETCH_LIMIT
    )) {
      // Limit to avoid too many calls
      try {
        const product = await productClient.getProduct(productId);
        if (product) {
          userProductDetails.push(product);
        }
      } catch (error) {
        logger.error("[CollaborativeService] Error fetching user product", {
          productId,
          error: error.message,
        });
      }
    }
    const productFetchDuration = Date.now() - productFetchStart;

    logger.info("[CollaborativeService] Fetched user product details", {
      fetchedCount: userProductDetails.length,
      duration: `${productFetchDuration}ms`,
    });

    if (userProductDetails.length === 0) {
      logger.warn("[CollaborativeService] No user product details found");
      return [];
    }

    // Extract user preferences from their products
    const userPreferences =
      this.extractPreferencesFromProducts(userProductDetails);
    logger.debug("[CollaborativeService] Extracted user preferences", {
      brands: Array.from(userPreferences.brands.keys()),
      categories: Array.from(userPreferences.categories.keys()),
      priceRange: userPreferences.priceRange,
      colorsCount: userPreferences.colors.size,
      useCasesCount: userPreferences.useCases.size,
    });

    // Get products matching user preferences
    const filters = {
      status: recommendationConfig.PRODUCT_FILTERING.REQUIRED_STATUS,
      isActive: recommendationConfig.PRODUCT_FILTERING.REQUIRED_ACTIVE,
      limit: recommendationConfig.DEFAULT_LIMITS.PRODUCT_FETCH_LIMIT,
    };

    logger.debug("[CollaborativeService] Fetching all products", { filters });
    const allProductsStart = Date.now();
    const productsResponse = await productClient.getProducts(filters);
    const allProductsDuration = Date.now() - allProductsStart;
    const allProducts = Array.isArray(productsResponse)
      ? productsResponse
      : productsResponse.products || [];
    logger.info("[CollaborativeService] Fetched all products", {
      count: allProducts.length,
      duration: `${allProductsDuration}ms`,
    });

    // Score products based on similarity to user's preferences
    let skippedCount = 0;
    let zeroScoreCount = 0;
    logger.debug("[CollaborativeService] Scoring products", {
      totalProducts: allProducts.length,
    });

    for (const product of allProducts) {
      // Skip products user already knows
      if (userProductIds.includes(product._id.toString())) {
        skippedCount++;
        continue;
      }

      // Filter by component type if specified
      if (
        componentType &&
        !productMatchesComponentType(product, componentType)
      ) {
        skippedCount++;
        continue;
      }

      // Calculate similarity score
      const score = this.calculateProductScore(
        product,
        userPreferences,
        userProductDetails
      );

      logger.debug("[CollaborativeService] Product scored", {
        productId: product._id?.toString(),
        productName: product.name,
        score,
      });

      if (score > 0) {
        recommendations.set(product._id.toString(), {
          productId: product._id,
          product,
          score,
          reasons: this.generateReasons(product, userPreferences),
        });
      } else {
        zeroScoreCount++;
      }
    }

    logger.info("[CollaborativeService] Scoring completed", {
      totalProducts: allProducts.length,
      skippedCount,
      zeroScoreCount,
      recommendationsCount: recommendations.size,
    });

    // Sort and return top N
    const sorted = Array.from(recommendations.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    logger.debug("[CollaborativeService] Sorted and limited recommendations", {
      beforeLimit: recommendations.size,
      afterLimit: sorted.length,
      topScores: sorted.slice(0, 5).map((r) => ({
        productId: r.productId?.toString(),
        score: r.score,
      })),
    });

    return sorted;
  }

  extractPreferencesFromProducts(products) {
    const preferences = {
      brands: new Map(),
      categories: new Map(),
      priceRange: { min: Infinity, max: 0 },
      colors: new Set(),
      useCases: new Set(),
    };

    const prices = [];

    for (const product of products) {
      // Brands
      if (product.brandId) {
        const brandId = product.brandId.toString();
        preferences.brands.set(
          brandId,
          (preferences.brands.get(brandId) || 0) + 1
        );
      }

      // Categories
      if (product.categoryId) {
        const catId = product.categoryId.toString();
        preferences.categories.set(
          catId,
          (preferences.categories.get(catId) || 0) + 1
        );
      }

      // Price
      const price =
        product.pricing?.salePrice || product.pricing?.originalPrice;
      if (price) prices.push(price);

      // Colors
      if (product.colors) {
        product.colors.forEach((color) => preferences.colors.add(color));
      }

      // Use cases
      if (product.specifications?.useCases) {
        product.specifications.useCases.forEach((uc) =>
          preferences.useCases.add(uc)
        );
      }
    }

    // Calculate price range
    if (prices.length > 0) {
      prices.sort((a, b) => a - b);
      preferences.priceRange = {
        min: prices[Math.floor(prices.length * 0.25)],
        max: prices[Math.floor(prices.length * 0.75)],
      };
    }

    return preferences;
  }

  calculateProductScore(product, userPreferences, userProducts) {
    let score = 0;
    let totalWeight = 0;
    const weights = recommendationConfig.COLLABORATIVE.SCORING_WEIGHTS;

    // Brand match
    if (product.brandId && userPreferences.brands.size > 0) {
      const brandId = product.brandId.toString();
      const brandCount = userPreferences.brands.get(brandId) || 0;
      if (brandCount > 0) {
        const maxBrandCount = Math.max(
          ...Array.from(userPreferences.brands.values())
        );
        score += (brandCount / maxBrandCount) * weights.brand;
        totalWeight += weights.brand;
      }
    }

    // Category match
    if (product.categoryId && userPreferences.categories.size > 0) {
      const catId = product.categoryId.toString();
      const catCount = userPreferences.categories.get(catId) || 0;
      if (catCount > 0) {
        const maxCatCount = Math.max(
          ...Array.from(userPreferences.categories.values())
        );
        score += (catCount / maxCatCount) * weights.category;
        totalWeight += weights.category;
      }
    }

    // Price appropriateness
    if (userPreferences.priceRange.min < Infinity) {
      const price =
        product.pricing?.salePrice || product.pricing?.originalPrice || 0;
      if (
        price >= userPreferences.priceRange.min &&
        price <= userPreferences.priceRange.max
      ) {
        score += weights.price;
        totalWeight += weights.price;
      }
    }

    // Popularity boost - products with more views/sales
    const popularity = Math.min(
      (product.views || 0) /
        recommendationConfig.POPULARITY.NORMALIZATION_FACTOR,
      1
    ); // Normalize to 0-1
    score += popularity * weights.popularity;
    totalWeight += weights.popularity;

    // Color match
    if (product.colors && userPreferences.colors.size > 0) {
      const hasMatchingColor = product.colors.some((color) =>
        userPreferences.colors.has(color)
      );
      if (hasMatchingColor) {
        score += weights.color;
        totalWeight += weights.color;
      }
    }

    // Use case match
    if (product.specifications?.useCases && userPreferences.useCases.size > 0) {
      const matchingUseCases = product.specifications.useCases.filter((uc) =>
        userPreferences.useCases.has(uc)
      );
      if (matchingUseCases.length > 0) {
        score += weights.useCase;
        totalWeight += weights.useCase;
      }
    }

    return totalWeight > 0
      ? Math.round(
          (score / totalWeight) * recommendationConfig.SCORING.MAX_SCORE
        )
      : recommendationConfig.SCORING.MIN_SCORE;
  }

  generateReasons(product, userPreferences) {
    const reasons = [];

    if (
      product.brandId &&
      userPreferences.brands.has(product.brandId.toString())
    ) {
      reasons.push("Người dùng tương tự đã mua sản phẩm cùng brand");
    }

    if (
      product.categoryId &&
      userPreferences.categories.has(product.categoryId.toString())
    ) {
      reasons.push("Phù hợp với category bạn thường xem");
    }

    const price =
      product.pricing?.salePrice || product.pricing?.originalPrice || 0;
    if (
      userPreferences.priceRange.min < Infinity &&
      price >= userPreferences.priceRange.min &&
      price <= userPreferences.priceRange.max
    ) {
      reasons.push("Trong khoảng giá bạn thường mua");
    }

    if (product.views > 100) {
      reasons.push("Sản phẩm phổ biến");
    }

    return reasons.length > 0
      ? reasons
      : ["Được đề xuất dựa trên sở thích của bạn"];
  }
}

module.exports = new CollaborativeService();
