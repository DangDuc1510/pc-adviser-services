const productClient = require("../clients/product.client");
const { calculateProductSimilarity } = require("../utils/similarity");
const { getCache, setCache } = require("../utils/cache");
const { productMatchesComponentType } = require("../utils/componentMapping");
const recommendationConfig = require("../utils/recommendation-config");
const { NotFoundError } = require("../errors");
const logger = require("../utils/logger");

/**
 * Get similar products using content-based filtering
 */
class SimilarityService {
  async getSimilarProducts(options) {
    const {
      productId,
      limit = recommendationConfig.DEFAULT_LIMITS.SIMILAR_PRODUCTS,
      category,
    } = options;
    logger.info('[SimilarityService] Starting similar products', {
      productId,
      limit,
      category
    });

    // Check cache
    const cacheKey = `similar:${productId}:${limit}`;
    logger.debug('[SimilarityService] Checking cache', { cacheKey });
    const cached = await getCache(cacheKey);
    if (cached) {
      logger.info('[SimilarityService] Cache hit, returning cached results', {
        cacheKey,
        count: cached.similarProducts?.length || 0
      });
      return cached;
    }
    logger.debug('[SimilarityService] Cache miss, proceeding with calculation');

    // Get reference product
    let referenceProduct;
    logger.debug('[SimilarityService] Fetching reference product', { productId });
    const productFetchStart = Date.now();
    try {
      referenceProduct = await productClient.getProduct(productId);

      if (!referenceProduct) {
        logger.warn(`[SimilarityService] Product ${productId} not found`);
        throw new NotFoundError(`Product not found: ${productId}`);
      }

      // Validate product has required fields
      if (!referenceProduct._id && !referenceProduct.id) {
        logger.warn(`[SimilarityService] Product ${productId} has invalid format`);
        throw new NotFoundError(`Product data invalid: ${productId}`);
      }

      const productFetchDuration = Date.now() - productFetchStart;
      logger.info('[SimilarityService] Reference product fetched', {
        productId,
        productName: referenceProduct.name,
        duration: `${productFetchDuration}ms`
      });
    } catch (error) {
      // If it's already a NotFoundError, re-throw it
      if (error instanceof NotFoundError) {
        throw error;
      }
      // Log other errors
      logger.error(`[SimilarityService] Error fetching product ${productId}:`, {
        message: error.message,
        stack: error.stack,
      });
      throw new NotFoundError(`Product not found: ${productId}`);
    }

    // Extract features
    const referenceFeatures = this.extractFeatures(referenceProduct);
    const targetCategory = category || referenceProduct.categoryId?.toString();
    logger.debug('[SimilarityService] Extracted reference features', {
      referenceFeatures,
      targetCategory
    });

    // Get products in same category or matching component type
    const filters = {
      status: recommendationConfig.PRODUCT_FILTERING.REQUIRED_STATUS,
      isActive: recommendationConfig.PRODUCT_FILTERING.REQUIRED_ACTIVE,
      limit: recommendationConfig.SIMILARITY.PRODUCT_FETCH_LIMIT, // Get more to filter
    };

    if (targetCategory) {
      filters.categoryId = targetCategory;
    }

    logger.debug('[SimilarityService] Fetching products from Product Service', { filters });
    const productsFetchStart = Date.now();
    const productsResponse = await productClient.getProducts(filters);
    const productsFetchDuration = Date.now() - productsFetchStart;
    let products = Array.isArray(productsResponse)
      ? productsResponse
      : productsResponse.products || [];
    logger.info('[SimilarityService] Fetched products', {
      count: products.length,
      duration: `${productsFetchDuration}ms`
    });

    // Filter by category if specified
    if (category && !targetCategory) {
      const beforeFilter = products.length;
      products = products.filter((p) => p.categoryId?.toString() === category);
      logger.debug('[SimilarityService] Filtered by category', {
        beforeFilter,
        afterFilter: products.length,
        category
      });
    }

    // Calculate similarity for each product
    const similarProducts = [];
    let skippedCount = 0;
    let zeroScoreCount = 0;

    logger.debug('[SimilarityService] Calculating similarity scores', {
      totalProducts: products.length
    });

    for (const product of products) {
      if (product._id.toString() === productId) {
        skippedCount++;
        continue; // Skip reference product
      }

      // Filter by component type if specified
      if (category && !productMatchesComponentType(product, category)) {
        skippedCount++;
        continue;
      }

      const features = this.extractFeatures(product);
      const similarityScore = calculateProductSimilarity(
        referenceFeatures,
        features
      );

      logger.debug('[SimilarityService] Calculated similarity', {
        productId: product._id?.toString(),
        productName: product.name,
        similarityScore,
        matchedFeatures: this.getMatchedFeatures(referenceFeatures, features)
      });

      if (similarityScore > 0) {
        similarProducts.push({
          productId: product._id,
          product,
          similarityScore,
          matchedFeatures: this.getMatchedFeatures(referenceFeatures, features),
        });
      } else {
        zeroScoreCount++;
      }
    }

    logger.info('[SimilarityService] Similarity calculation completed', {
      totalProducts: products.length,
      skippedCount,
      zeroScoreCount,
      similarProductsCount: similarProducts.length
    });

    // Sort by similarity and limit
    similarProducts.sort((a, b) => b.similarityScore - a.similarityScore);
    const topSimilar = similarProducts.slice(0, limit);

    logger.debug('[SimilarityService] Sorted and limited results', {
      beforeLimit: similarProducts.length,
      afterLimit: topSimilar.length,
      topScores: topSimilar.slice(0, 5).map(p => ({
        productId: p.productId?.toString(),
        similarityScore: p.similarityScore
      }))
    });

    const result = {
      referenceProduct: {
        id: referenceProduct._id,
        name: referenceProduct.name,
        category: referenceProduct.categoryId,
      },
      similarProducts: topSimilar,
    };

    // Cache result
    logger.debug('[SimilarityService] Caching result', { cacheKey });
    await setCache(cacheKey, result);

    logger.info('[SimilarityService] Returning similar products', {
      referenceProductId: productId,
      similarProductsCount: topSimilar.length
    });

    return result;
  }

  extractFeatures(product) {
    const price =
      product.pricing?.salePrice || product.pricing?.originalPrice || 0;

    return {
      brand: product.brandId?.toString(),
      price,
      specifications: {
        socket: product.specifications?.socket,
        chipset: product.specifications?.chipset,
        memory: product.specifications?.memory,
        formFactor: product.specifications?.formFactor,
      },
      colors: product.colors || [],
      useCases: product.specifications?.useCases || [],
    };
  }

  getMatchedFeatures(refFeatures, features) {
    const matched = [];

    if (
      refFeatures.brand &&
      features.brand &&
      refFeatures.brand === features.brand
    ) {
      matched.push(`Same brand`);
    }

    if (
      refFeatures.specifications?.socket &&
      features.specifications?.socket &&
      refFeatures.specifications.socket === features.specifications.socket
    ) {
      matched.push(`Same socket (${refFeatures.specifications.socket})`);
    }

    if (refFeatures.price && features.price) {
      const priceDiff = Math.abs(refFeatures.price - features.price);
      const percentDiff = (priceDiff / refFeatures.price) * 100;
      if (
        percentDiff <= recommendationConfig.SIMILARITY.PRICE_DIFF_THRESHOLD
      ) {
        matched.push(`Similar price (±${percentDiff.toFixed(1)}%)`);
      }
    }

    if (
      refFeatures.useCases &&
      features.useCases &&
      refFeatures.useCases.length > 0
    ) {
      const commonUseCases = refFeatures.useCases.filter((uc) =>
        features.useCases.includes(uc)
      );
      if (commonUseCases.length > 0) {
        matched.push(`Same use cases (${commonUseCases.join(", ")})`);
      }
    }

    return matched;
  }
}

module.exports = new SimilarityService();
