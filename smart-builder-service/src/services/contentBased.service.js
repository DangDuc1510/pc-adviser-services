const identityClient = require("../clients/identity.client");
const productClient = require("../clients/product.client");
const orderClient = require("../clients/order.client");
const userPreferenceRepository = require("../repositories/userPreference.repository");
const { getCache, setCache, getUserPreferenceKey } = require("../utils/cache");
const { productMatchesComponentType } = require("../utils/componentMapping");
const recommendationConfig = require("../utils/recommendation-config");
const logger = require("../utils/logger");

/**
 * Content-based filtering service
 * Recommends products based on user preferences extracted from behavior
 */
class ContentBasedService {
  async getRecommendations(options) {
    const {
      userId,
      componentType,
      limit = recommendationConfig.DEFAULT_LIMITS.PERSONALIZED_RECOMMENDATIONS,
    } = options;
    const behaviorStartTime = Date.now();
    const behaviorData = await identityClient.getUserBehavior(userId, {
      limit: recommendationConfig.CONTENT_BASED.BEHAVIOR_EVENTS_LIMIT,
    });

    const userProfile = await this.getUserProfile(userId);

    if (
      !userProfile ||
      Object.keys(userProfile.preferences.brands).length === 0
    ) {
      return {
        recommendations: [],
        message: recommendationConfig.ERROR_HANDLING.INSUFFICIENT_DATA_MESSAGE,
      };
    }

    // Get products matching preferences
    const filters = {
      status: recommendationConfig.PRODUCT_FILTERING.REQUIRED_STATUS,
      isActive: recommendationConfig.PRODUCT_FILTERING.REQUIRED_ACTIVE,
      limit: recommendationConfig.DEFAULT_LIMITS.PRODUCT_FETCH_LIMIT,
    };

    logger.debug("[ContentBasedService] Fetching lightweight products", { filters });
    const productsStartTime = Date.now();
    // Use lightweight API for faster fetching
    const productsResponse = await productClient.getLightweightProducts(filters);
    const productsDuration = Date.now() - productsStartTime;
    let products = Array.isArray(productsResponse)
      ? productsResponse
      : productsResponse.products || [];
    logger.info("[ContentBasedService] Fetched products", {
      count: products.length,
      duration: `${productsDuration}ms`,
    });

    // Filter by component type if specified
    if (componentType) {
      const beforeFilter = products.length;
      products = products.filter((product) =>
        productMatchesComponentType(product, componentType)
      );
      logger.debug("[ContentBasedService] Filtered by component type", {
        beforeFilter,
        afterFilter: products.length,
        componentType,
      });
    }

    // Get removed products from behavior to exclude them
    const removedProducts = new Set();
    (behaviorData.events || []).forEach((event) => {
      if (event.eventType === "remove_from_cart" && event.entityId) {
        const removeCount = (behaviorData.events || []).filter(
          (e) =>
            e.entityId === event.entityId && e.eventType === "remove_from_cart"
        ).length;
        // Exclude products removed multiple times
        if (
          removeCount >=
          recommendationConfig.CONTENT_BASED.MAX_REMOVE_FOR_LEARNING
        ) {
          removedProducts.add(event.entityId);
        }
      }
    });

    logger.debug("[ContentBasedService] Identified removed products", {
      removedProductsCount: removedProducts.size,
    });

    // Score products based on user profile
    const recommendations = [];
    let skippedCount = 0;
    let zeroScoreCount = 0;

    logger.debug("[ContentBasedService] Scoring products", {
      totalProducts: products.length,
    });

    for (const product of products) {
      // Skip removed products
      if (removedProducts.has(product._id.toString())) {
        skippedCount++;
        logger.debug("[ContentBasedService] Product skipped (removed)", {
          productId: product._id?.toString(),
        });
        continue;
      }

      const score = this.scoreProduct(product, userProfile);

      logger.debug("[ContentBasedService] Product scored", {
        productId: product._id?.toString(),
        productName: product.name,
        score,
      });

      if (score > 0) {
        recommendations.push({
          productId: product._id,
          product,
          score,
          reasons: this.generateReasons(product, userProfile),
        });
      } else {
        zeroScoreCount++;
      }
    }

    logger.info("[ContentBasedService] Scoring completed", {
      totalProducts: products.length,
      skippedCount,
      zeroScoreCount,
      recommendationsCount: recommendations.length,
    });

    // Sort and limit
    recommendations.sort((a, b) => b.score - a.score);
    const topRecommendations = recommendations.slice(0, limit);

    logger.debug("[ContentBasedService] Sorted and limited recommendations", {
      beforeLimit: recommendations.length,
      afterLimit: topRecommendations.length,
      topScores: topRecommendations.slice(0, 5).map((r) => ({
        productId: r.productId?.toString(),
        score: r.score,
      })),
    });

    logger.info(
      "[ContentBasedService] Returning content-based recommendations",
      {
        count: topRecommendations.length,
      }
    );

    return {
      recommendations: topRecommendations,
      userProfile,
      strategy: "content-based",
    };
  }

  async getUserProfile(userId) {
    if (!userId) {
      throw new Error("userId là bắt buộc");
    }

    // Check cache
    const cacheKey = getUserPreferenceKey(userId);
    const cached = await getCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Get from database
    let userPref = await userPreferenceRepository.findByUserId(userId);

    if (userPref && new Date(userPref.expiresAt) > new Date()) {
      await setCache(cacheKey, userPref);
      return userPref;
    }

    // Build profile from behavior data
    userPref = await this.buildUserProfile(userId);

    if (userPref) {
      await setCache(cacheKey, userPref);
    }

    return userPref;
  }

  async buildUserProfile(userId) {
    if (!userId) {
      throw new Error("userId là bắt buộc");
    }

    logger.info("[ContentBasedService] Building user profile", {
      userId,
    });

    // Get behavior data
    logger.debug("[ContentBasedService] Fetching behavior data for profile", {
      userId,
    });
    const behaviorStartTime = Date.now();
    const behaviorData = await identityClient.getUserBehavior(userId, {
      limit: recommendationConfig.CONTENT_BASED.BEHAVIOR_EVENTS_LIMIT,
    });
    const behaviorDuration = Date.now() - behaviorStartTime;

    const events = behaviorData.events || [];
    logger.info("[ContentBasedService] Fetched behavior data for profile", {
      eventsCount: events.length,
      duration: `${behaviorDuration}ms`,
    });

    // Get order data
    let orders = [];
    if (userId) {
      try {
        logger.debug("[ContentBasedService] Fetching order data", { userId });
        const orderStartTime = Date.now();
        const orderData = await orderClient.getUserOrders(userId);
        const orderDuration = Date.now() - orderStartTime;
        orders = orderData.orders || [];
        logger.info("[ContentBasedService] Fetched order data", {
          ordersCount: orders.length,
          duration: `${orderDuration}ms`,
        });
      } catch (error) {
        logger.error("[ContentBasedService] Error fetching orders", {
          error: error.message,
          userId,
        });
      }
    }

    // Extract preferences
    const brands = new Map();
    const categories = new Map();
    const prices = [];
    const colors = new Set();
    const useCases = new Set();

    // Track removed products to exclude from recommendations
    const removedProducts = new Map(); // productId -> count

    // Process behavior events
    for (const event of events) {
      if (event.entityType !== "product" || !event.entityId) continue;

      // Track removals
      if (event.eventType === "remove_from_cart") {
        const productId = event.entityId;
        removedProducts.set(
          productId,
          (removedProducts.get(productId) || 0) + 1
        );
        // Skip processing removals - they reduce preferences
        continue;
      }

      try {
        const product = await productClient.getProduct(event.entityId);
        if (!product) continue;

        // Skip products that have been removed multiple times
        const removeCount = removedProducts.get(event.entityId) || 0;
        if (
          removeCount >=
          recommendationConfig.CONTENT_BASED.MAX_REMOVE_FOR_LEARNING
        ) {
          continue; // Don't learn preferences from heavily removed products
        }

        // Brand preference (reduce weight if product was removed)
        if (product.brandId) {
          const brandId = product.brandId.toString();
          const weight =
            removeCount > 0
              ? recommendationConfig.CONTENT_BASED.REMOVED_WEIGHT_REDUCTION
              : 1; // Reduce weight if removed
          brands.set(brandId, (brands.get(brandId) || 0) + weight);
        }

        // Category preference (reduce weight if product was removed)
        if (product.categoryId) {
          const catId = product.categoryId.toString();
          const weight =
            removeCount > 0
              ? recommendationConfig.CONTENT_BASED.REMOVED_WEIGHT_REDUCTION
              : 1;
          categories.set(catId, (categories.get(catId) || 0) + weight);
        }

        // Colors (only if not removed)
        if (product.colors && removeCount === 0) {
          product.colors.forEach((color) => colors.add(color));
        }

        // Use cases (only if not removed)
        if (product.specifications?.useCases && removeCount === 0) {
          product.specifications.useCases.forEach((uc) => useCases.add(uc));
        }

        // Price (only if not removed)
        if (removeCount === 0) {
          const price =
            product.pricing?.salePrice || product.pricing?.originalPrice;
          if (price) prices.push(price);
        }
      } catch (error) {
        console.error(
          `Error processing product ${event.entityId}:`,
          error.message
        );
        continue;
      }
    }

    // Process orders
    for (const order of orders) {
      for (const item of order.products || []) {
        if (item.price) prices.push(item.price);
      }
    }

    logger.info("[ContentBasedService] Extracted preferences from behavior", {
      brandsCount: brands.size,
      categoriesCount: categories.size,
      pricesCount: prices.length,
      colorsCount: colors.size,
      useCasesCount: useCases.size,
      removedProductsCount: removedProducts.size,
    });

    // Normalize brand and category preferences (0-1 scale)
    const maxBrandCount = Math.max(...Array.from(brands.values()), 1);
    const normalizedBrands = new Map();
    for (const [brandId, count] of brands.entries()) {
      normalizedBrands.set(brandId, count / maxBrandCount);
    }

    const maxCategoryCount = Math.max(...Array.from(categories.values()), 1);
    const normalizedCategories = new Map();
    for (const [catId, count] of categories.entries()) {
      normalizedCategories.set(catId, count / maxCategoryCount);
    }

    logger.debug("[ContentBasedService] Normalized preferences", {
      normalizedBrands: Array.from(normalizedBrands.entries()).slice(0, 5),
      normalizedCategories: Array.from(normalizedCategories.entries()).slice(
        0,
        5
      ),
    });

    // Calculate price range
    let priceRange = { min: 0, max: 0 };
    if (prices.length > 0) {
      prices.sort((a, b) => a - b);
      const q25 = prices[Math.floor(prices.length * 0.25)];
      const q75 = prices[Math.floor(prices.length * 0.75)];
      priceRange = {
        min: q25,
        max: q75,
      };
      logger.debug("[ContentBasedService] Calculated price range", {
        priceRange,
        pricesCount: prices.length,
      });
    }

    const preferences = {
      brands: normalizedBrands,
      categories: normalizedCategories,
      priceRange,
      colors: Array.from(colors),
      useCases: Array.from(useCases),
    };

    // Save to database
    logger.debug("[ContentBasedService] Saving user preference to database", {
      userId,
    });
    const userPreference = await userPreferenceRepository.createOrUpdate({
      userId,
      preferences,
    });

    logger.info("[ContentBasedService] User profile built and saved", {
      userId,
      preferenceId: userPreference._id?.toString(),
    });

    return userPreference.toObject();
  }

  scoreProduct(product, userProfile) {
    let score = 0;
    let totalWeight = 0;
    const scoreBreakdown = {};

    const prefs = userProfile.preferences;

    const weights = recommendationConfig.CONTENT_BASED.SCORING_WEIGHTS;

    // Brand score
    if (product.brandId && prefs.brands) {
      const brandId = product.brandId.toString();
      const brandPref = prefs.brands.get
        ? prefs.brands.get(brandId)
        : prefs.brands[brandId];
      if (brandPref) {
        const brandScore = brandPref * weights.brand;
        score += brandScore;
        totalWeight += weights.brand;
        scoreBreakdown.brand = brandScore;
      }
    }

    // Category score
    if (product.categoryId && prefs.categories) {
      const catId = product.categoryId.toString();
      const catPref = prefs.categories.get
        ? prefs.categories.get(catId)
        : prefs.categories[catId];
      if (catPref) {
        const categoryScore = catPref * weights.category;
        score += categoryScore;
        totalWeight += weights.category;
        scoreBreakdown.category = categoryScore;
      }
    }

    // Price score
    if (prefs.priceRange && prefs.priceRange.min > 0) {
      const price =
        product.pricing?.salePrice || product.pricing?.originalPrice || 0;
      if (price >= prefs.priceRange.min && price <= prefs.priceRange.max) {
        score += weights.price;
        totalWeight += weights.price;
        scoreBreakdown.price = weights.price;
      }
    }

    // Color score
    if (product.colors && prefs.colors && prefs.colors.length > 0) {
      const hasMatchingColor = product.colors.some((color) =>
        prefs.colors.includes(color)
      );
      if (hasMatchingColor) {
        score += weights.color;
        totalWeight += weights.color;
        scoreBreakdown.color = weights.color;
      }
    }

    // Use case score
    if (
      product.specifications?.useCases &&
      prefs.useCases &&
      prefs.useCases.length > 0
    ) {
      const matchingUseCases = product.specifications.useCases.filter((uc) =>
        prefs.useCases.includes(uc)
      );
      if (matchingUseCases.length > 0) {
        score += weights.useCase;
        totalWeight += weights.useCase;
        scoreBreakdown.useCase = weights.useCase;
      }
    }

    const finalScore =
      totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0;

    logger.debug("[ContentBasedService] Product scoring breakdown", {
      productId: product._id?.toString(),
      scoreBreakdown,
      totalScore: score,
      totalWeight,
      finalScore,
    });

    return finalScore;
  }

  generateReasons(product, userProfile) {
    const reasons = [];
    const prefs = userProfile.preferences;

    if (product.brandId && prefs.brands) {
      const brandId = product.brandId.toString();
      const brandPref = prefs.brands.get
        ? prefs.brands.get(brandId)
        : prefs.brands[brandId];
      if (brandPref && brandPref > 0.5) {
        reasons.push("Phù hợp với brand bạn thích");
      }
    }

    if (prefs.priceRange && prefs.priceRange.min > 0) {
      const price =
        product.pricing?.salePrice || product.pricing?.originalPrice || 0;
      if (price >= prefs.priceRange.min && price <= prefs.priceRange.max) {
        reasons.push("Trong khoảng giá bạn thường mua");
      }
    }

    if (product.colors && prefs.colors && prefs.colors.length > 0) {
      const hasMatchingColor = product.colors.some((color) =>
        prefs.colors.includes(color)
      );
      if (hasMatchingColor) {
        reasons.push("Màu sắc phù hợp với sở thích của bạn");
      }
    }

    return reasons;
  }
}

module.exports = new ContentBasedService();
