const compatibilityService = require("./compatibility.service");
const productClient = require("../clients/product.client");
const recommendationConfig = require("../utils/recommendation-config");
const { hashObject } = require("../utils/helpers");
const { getCache, setCache } = require("../utils/cache");
const config = require("../config/env");
const logger = require("../utils/logger");

/**
 * Service to provide build suggestions for missing components
 * Based on currently selected components in the PC build
 */
class BuildSuggestionsService {
  /**
   * Get suggestions for a single missing component type
   * @param {Object} options - Options object
   * @param {Object} options.currentConfig - Current build configuration (componentType -> product)
   * @param {String} options.categoryId - Category ID to suggest products for
   * @param {Number} options.limitPerComponent - Limit of suggestions (max 6)
   * @returns {Promise<Object>} Suggestions for the category
   */
  async getBuildSuggestions(options) {
    const {
      currentConfig = {},
      categoryId,
      limitPerComponent = Math.min(6, recommendationConfig.DEFAULT_LIMITS.COMPATIBLE_PRODUCTS),
    } = options;

    // Ensure limit doesn't exceed 6
    const maxLimit = Math.min(6, limitPerComponent);

    logger.info("[BuildSuggestionsService] Starting build suggestions", {
      currentConfigKeys: Object.keys(currentConfig),
      categoryId,
      limitPerComponent: maxLimit,
    });

    const startTime = Date.now();

    try {
      // Convert currentConfig to currentComponents array format
      const currentComponents = this.convertConfigToComponents(currentConfig);
      logger.debug("[BuildSuggestionsService] Converted config to components", {
        componentsCount: currentComponents.length,
        components: currentComponents.map((c) => ({
          type: c.type,
          productId: c.product?._id || c.productId,
        })),
      });

      // Check cache for build suggestions
      const buildCacheKey = this.getBuildSuggestionsCacheKey(
        currentComponents,
        categoryId,
        maxLimit
      );
      const cachedBuild = await getCache(buildCacheKey);
      if (cachedBuild) {
        logger.info("[BuildSuggestionsService] Build suggestions cache hit", {
          cacheKey: buildCacheKey,
          categoryId,
          recommendationsCount: cachedBuild.recommendations?.length || 0,
          duration: `${Date.now() - startTime}ms`
        });
        
        // If cached result has no recommendations, try fallback to popular products
        if (!cachedBuild.recommendations || cachedBuild.recommendations.length === 0) {
          logger.info("[BuildSuggestionsService] Cached result has no recommendations, trying popular products fallback", {
            categoryId
          });
          
          try {
            const popularProducts = await this.getPopularProducts(categoryId, maxLimit);
            if (popularProducts.length > 0) {
              logger.info("[BuildSuggestionsService] Popular products fallback successful", {
                categoryId,
                popularProductsCount: popularProducts.length
              });
              return {
                ...cachedBuild,
                recommendations: popularProducts,
                isFallback: true,
                fromCache: true
              };
            }
          } catch (fallbackError) {
            logger.error("[BuildSuggestionsService] Error getting popular products fallback from cache", {
              error: fallbackError.message,
              categoryId
            });
          }
        }
        
        return {
          ...cachedBuild,
          fromCache: true
        };
      }

      // Get suggestions for the category
      const result = await this.getSuggestionsForCategory(
        categoryId,
        currentComponents,
        maxLimit
      ).catch((error) => {
        logger.error(
          `[BuildSuggestionsService] Error getting suggestions for category ${categoryId}`,
          {
            error: error.message,
            categoryId,
          }
        );
        // Return empty suggestions on error instead of throwing
        return {
          categoryId,
          recommendations: [],
          filters: {},
          error: error.message,
        };
      });

      // Ensure recommendations don't exceed max limit
      let recommendations = (result.recommendations || []).slice(0, maxLimit);

      // Fallback to popular products if no recommendations found
      if (recommendations.length === 0) {
        logger.info("[BuildSuggestionsService] No compatible recommendations found, falling back to popular products", {
          categoryId
        });
        
        try {
          const popularProducts = await this.getPopularProducts(categoryId, maxLimit);
          recommendations = popularProducts;
          
          logger.info("[BuildSuggestionsService] Fallback to popular products completed", {
            categoryId,
            popularProductsCount: popularProducts.length
          });
        } catch (fallbackError) {
          logger.error("[BuildSuggestionsService] Error getting popular products fallback", {
            error: fallbackError.message,
            categoryId
          });
          // Continue with empty recommendations if fallback fails
        }
      }

      const duration = Date.now() - startTime;
      const response = {
        categoryId,
        recommendations,
        filters: result.filters || {},
        currentComponents,
        duration,
        fromCache: false,
        error: result.error || null,
        isFallback: recommendations.length > 0 && (result.recommendations || []).length === 0
      };

      // Cache the result (5 minutes TTL)
      await setCache(buildCacheKey, response, 300);

      logger.info("[BuildSuggestionsService] Build suggestions completed", {
        duration: `${duration}ms`,
        categoryId,
        recommendationsCount: recommendations.length,
        fromCache: false,
        isFallback: response.isFallback
      });

      return response;
    } catch (error) {
      logger.error("[BuildSuggestionsService] Error in getBuildSuggestions", {
        error: error.message,
        stack: error.stack,
        options,
      });
      throw error;
    }
  }

  /**
   * Generate cache key for build suggestions
   * @param {Array} currentComponents - Current build components
   * @param {String} categoryId - Category ID to suggest
   * @param {Number} limitPerComponent - Limit per component
   * @returns {String} Cache key
   */
  getBuildSuggestionsCacheKey(currentComponents, categoryId, limitPerComponent) {
    const componentsHash = hashObject(
      currentComponents.map(c => ({
        type: c.type,
        productId: c.productId || c.product?._id?.toString()
      }))
    );
    return `build_suggestions:${componentsHash}:${categoryId}:${limitPerComponent}`;
  }

  /**
   * Convert currentConfig format to currentComponents array format
   * @param {Object} currentConfig - Config object { componentType: { productId, specifications } }
   * @returns {Array} Array of component objects
   */
  convertConfigToComponents(currentConfig) {
    const components = [];

    Object.entries(currentConfig).forEach(([componentType, data]) => {
      // Handle both old format (full product object) and new format (lightweight)
      if (data) {
        if (data.productId) {
          // New lightweight format
          components.push({
            type: componentType,
            product: {
              _id: data.productId,
              specifications: data.specifications || {},
            },
            productId: data.productId,
          });
        } else if (data._id) {
          // Old format (full product object) - for backward compatibility
          components.push({
            type: componentType,
            product: data,
            productId: data._id,
          });
        }
      }
    });

    return components;
  }


  /**
   * Get suggestions for a specific category
   * @param {String} categoryId - Category ID to get suggestions for
   * @param {Array} currentComponents - Current build components
   * @param {Number} limit - Limit of suggestions
   * @returns {Promise<Object>} Suggestions for the category
   */
  async getSuggestionsForCategory(
    categoryId,
    currentComponents,
    limit
  ) {
    logger.debug(
      "[BuildSuggestionsService] Getting suggestions for category",
      {
        categoryId,
        currentComponentsCount: currentComponents.length,
        limit,
      }
    );

    try {
      // Fetch products for this category, sorted by popularity
      const filters = {
        status: recommendationConfig.PRODUCT_FILTERING.REQUIRED_STATUS,
        isActive: recommendationConfig.PRODUCT_FILTERING.REQUIRED_ACTIVE,
        categoryId: categoryId,
        limit: limit * 3, // Fetch more to filter by compatibility
        sortBy: "views", // Sort by views field
        sortOrder: "desc", // Descending order (most viewed first)
      };

      const productsResponse = await productClient.getLightweightProducts(filters);
      let products = Array.isArray(productsResponse) 
        ? productsResponse 
        : (productsResponse.products || []);

      logger.debug("[BuildSuggestionsService] Fetched products for category", {
        categoryId,
        productsCount: products.length
      });

      // Always fetch full product data to ensure images are included
      const productsWithImages = await Promise.all(
        products.slice(0, limit).map(async (product) => {
          try {
            // Fetch full product data to get images
            const fullProduct = await productClient.getProduct(product._id?.toString() || product.id?.toString());
            return fullProduct || product;
          } catch (error) {
            logger.warn("[BuildSuggestionsService] Failed to fetch full product, using lightweight", {
              productId: product._id,
              error: error.message
            });
            return product;
          }
        })
      );

      // If we have current components, try to get compatible recommendations
      // Otherwise, just return popular products from this category
      if (currentComponents.length > 0) {
        // Try to get compatible recommendations
        // Note: compatibility service still uses componentType, so we'll filter by category first
        // and then apply compatibility scoring
        const recommendations = await this.scoreProductsForCompatibility(
          productsWithImages,
          currentComponents,
          limit
        );

        return {
          categoryId,
          recommendations,
          filters: {},
        };
      } else {
        // No current components, just return popular products from category
        // Products are already sorted by views from the API
        const recommendations = productsWithImages.map(product => ({
          productId: product._id || product.id,
          product: product,
          score: product.views || 0,
          compatibility: {},
          reasons: ["Sản phẩm phổ biến trong danh mục"],
          scores: {
            compatibility: 0,
            price: 0,
            brand: 0,
            popularity: (product.views || 0) / recommendationConfig.POPULARITY.COMPATIBILITY_NORMALIZATION,
          }
        }));

        return {
          categoryId,
          recommendations,
          filters: {},
        };
      }
    } catch (error) {
      logger.error(
        `[BuildSuggestionsService] Error getting suggestions for category ${categoryId}`,
        {
          error: error.message,
          categoryId,
        }
      );
      throw error;
    }
  }

  /**
   * Score products for compatibility with current components
   * @param {Array} products - Products to score (should have full data including images)
   * @param {Array} currentComponents - Current build components
   * @param {Number} limit - Limit of recommendations
   * @returns {Promise<Array>} Scored recommendations
   */
  async scoreProductsForCompatibility(products, currentComponents, limit) {
    // For now, return products sorted by views (popularity)
    // TODO: Implement compatibility scoring if needed
    const sortedProducts = products
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, limit);

    return sortedProducts.map(product => ({
      productId: product._id || product.id,
      product: product, // Full product with images
      score: product.views || 0,
      compatibility: {},
      reasons: ["Sản phẩm phổ biến trong danh mục"],
      scores: {
        compatibility: 0,
        price: 0,
        brand: 0,
        popularity: (product.views || 0) / recommendationConfig.POPULARITY.COMPATIBILITY_NORMALIZATION,
      }
    }));
  }

  /**
   * Get popular products for a category (fallback when no compatible recommendations)
   * @param {String} categoryId - Category ID
   * @param {Number} limit - Limit of products
   * @returns {Promise<Array>} Popular products formatted as recommendations
   */
  async getPopularProducts(categoryId, limit) {
    logger.debug("[BuildSuggestionsService] Getting popular products", {
      categoryId,
      limit
    });

    try {
      // Fetch lightweight products sorted by views (popular) filtered by categoryId
      const filters = {
        status: recommendationConfig.PRODUCT_FILTERING.REQUIRED_STATUS,
        isActive: recommendationConfig.PRODUCT_FILTERING.REQUIRED_ACTIVE,
        categoryId: categoryId, // Filter by categoryId
        limit: limit,
        sortBy: "views", // Sort by views field
        sortOrder: "desc", // Descending order (most viewed first)
      };

      const productsResponse = await productClient.getLightweightProducts(filters);
      let products = Array.isArray(productsResponse) 
        ? productsResponse 
        : (productsResponse.products || []);

      logger.info("[BuildSuggestionsService] Fetched popular products for category", {
        categoryId,
        productsCount: products.length
      });

      // Take top N products
      products = products.slice(0, limit);

      // Fetch full product data for all products to ensure images are included
      const recommendations = await Promise.all(
        products.map(async (product) => {
          try {
            // Fetch full product data to get images
            const fullProduct = await productClient.getProduct(product._id?.toString() || product.id?.toString());
            
            // Ensure we have images in the product
            const productWithImages = fullProduct || product;
            
            return {
              productId: product._id || product.id,
              product: productWithImages, // Full product with images
              score: product.views || 0, // Use views as score for popular products
              compatibility: {}, // No compatibility check for popular products
              reasons: ["Sản phẩm được nhiều người xem"],
              scores: {
                compatibility: 0,
                price: 0,
                brand: 0,
                popularity: (product.views || 0) / recommendationConfig.POPULARITY.COMPATIBILITY_NORMALIZATION,
              }
            };
          } catch (error) {
            logger.warn("[BuildSuggestionsService] Failed to fetch full product for popular product", {
              productId: product._id,
              error: error.message
            });
            // Return lightweight product if full fetch fails (may not have images)
            // But at least we tried to get full product
            return {
              productId: product._id || product.id,
              product: product, // Lightweight product (may not have images)
              score: product.views || 0,
              compatibility: {},
              reasons: ["Sản phẩm được nhiều người xem"],
              scores: {
                compatibility: 0,
                price: 0,
                brand: 0,
                popularity: (product.views || 0) / recommendationConfig.POPULARITY.COMPATIBILITY_NORMALIZATION,
              }
            };
          }
        })
      );

      logger.info("[BuildSuggestionsService] Popular products fetched", {
        categoryId,
        count: recommendations.length
      });

      return recommendations;
    } catch (error) {
      logger.error("[BuildSuggestionsService] Error getting popular products", {
        error: error.message,
        categoryId
      });
      throw error;
    }
  }
}

module.exports = new BuildSuggestionsService();
