const { client } = require("../elastic/client");
const elasticsearchService = require("../services/elasticsearch.service");
const queryBuilder = require("../utils/queryBuilder");
const cacheService = require("../services/cache.service");
const config = require("../config");
const logger = require("../utils/logger");

/**
 * Search products with autocomplete suggestions
 * Returns: { products: [], suggest_keywords: [] }
 */
exports.searchProducts = async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;

    // Validate query
    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        products: [],
        suggest_keywords: [],
      });
    }

    const keyword = q.trim();
    const searchLimit = Math.min(parseInt(limit) || 10, 20);

    // Check cache
    const cacheKey = cacheService.generateCacheKey(
      "search",
      keyword,
      searchLimit
    );
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.debug("Cache hit for search", { keyword, limit: searchLimit });
      return res.json({
        success: true,
        ...cached,
      });
    }

    // Build Elasticsearch query
    const esQuery = {
      size: searchLimit,
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: keyword,
                fields: [
                  "name^3",
                  "slug^2",
                  "brand^2",
                  "description",
                  "specs",
                  "category.text^2",
                  "category",
                ],
                type: "best_fields",
                fuzziness: "AUTO",
                operator: "or",
              },
            },
          ],
          filter: [
            {
              term: {
                "inventory.inStock": true,
              },
            },
          ],
        },
      },
      _source: [
        "id",
        "name",
        "slug",
        "price",
        "image",
        "brand",
        "brandId",
        "category",
        "categoryId",
      ],
    };

    // Execute search using elasticsearch service
    const result = await elasticsearchService.search(esQuery);

    // Extract products
    const products = result.hits.hits.map((hit) => ({
      id: hit._source.id || hit._id,
      name: hit._source.name,
      slug: hit._source.slug,
      price: hit._source.price,
      image: hit._source.image,
      brand: hit._source.brand,
      brandId: hit._source.brandId,
      category: hit._source.category,
      categoryId: hit._source.categoryId,
    }));

    // Extract unique categories and brands from products
    const categoriesMap = new Map();
    const brandsMap = new Map();

    products.forEach((product) => {
      if (product.categoryId && product.category) {
        if (!categoriesMap.has(product.categoryId)) {
          categoriesMap.set(product.categoryId, {
            id: product.categoryId,
            name: product.category,
          });
        }
      }
      if (product.brandId && product.brand) {
        if (!brandsMap.has(product.brandId)) {
          brandsMap.set(product.brandId, {
            id: product.brandId,
            name: product.brand,
          });
        }
      }
    });

    const categories = Array.from(categoriesMap.values()).filter((cat) =>
      cat.name.toLowerCase().includes(keyword.toLowerCase())
    );
    const brands = Array.from(brandsMap.values()).filter((brand) =>
      brand.name.toLowerCase().includes(keyword.toLowerCase())
    );

    // Generate suggest keywords from product names
    const suggestKeywords = extractSuggestKeywords(keyword, products);

    const response = {
      products,
      suggest_keywords: suggestKeywords,
      categories,
      brands,
    };

    // Cache result (30 seconds for autocomplete)
    await cacheService.set(cacheKey, response, 30);

    res.json({
      success: true,
      ...response,
    });
  } catch (error) {
    logger.error("Search products error", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * Legacy search endpoint (backward compatibility)
 */
exports.search = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Missing query parameter",
      });
    }

    const result = await elasticsearchService.search({
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: q,
                fields: [
                  "name^3",
                  "brand^2",
                  "specs",
                  "description",
                  "type",
                  "category",
                ],
              },
            },
          ],
          filter: [
            {
              term: {
                "inventory.inStock": true,
              },
            },
          ],
        },
      },
    });

    res.json({
      success: true,
      products: result.hits.hits.map((hit) => hit._source),
    });
  } catch (error) {
    logger.error("Search error", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * Autocomplete endpoint
 */
exports.autocomplete = async (req, res, next) => {
  try {
    const { prefix } = req.query;
    if (!prefix || prefix.trim().length < 2) {
      return res.json({
        success: true,
        suggestions: [],
      });
    }

    const result = await elasticsearchService.search({
      suggest: {
        product_suggest: {
          prefix: prefix.trim(),
          completion: {
            field: "suggest",
            fuzzy: { fuzziness: 1 },
          },
        },
      },
    });

    const suggestions =
      result.suggest?.product_suggest?.[0]?.options?.map((opt) => opt.text) ||
      [];

    res.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    logger.error("Autocomplete error", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * Webhook endpoint for Product Service to notify about product changes
 * POST /search/webhook/product
 */
exports.webhookProduct = async (req, res, next) => {
  try {
    const { action, product } = req.body;

    if (!action || !product) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: action and product",
      });
    }

    const productId =
      product._id?.toString() ||
      product.id?.toString() ||
      product.productId?.toString();

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    logger.info("Received product webhook", {
      action,
      productId,
    });

    const elasticsearchService = require("../services/elasticsearch.service");
    const cacheService = require("../services/cache.service");

    switch (action) {
      case "created":
      case "updated":
        // Transform and index product
        const doc = transformProductToDocument(product);
        await elasticsearchService.updateDocument(productId, doc);

        // Invalidate cache
        await cacheService.delPattern("search:*");

        logger.info("Product indexed via webhook", { productId, action });
        break;

      case "deleted":
        // Delete from index
        await elasticsearchService.deleteDocument(productId);

        // Invalidate cache
        await cacheService.delPattern("search:*");

        logger.info("Product deleted from index via webhook", { productId });
        break;

      default:
        logger.warn("Unknown webhook action", { action, productId });
        return res.status(400).json({
          success: false,
          message: `Unknown action: ${action}. Supported actions: created, updated, deleted`,
        });
    }

    res.json({
      success: true,
      message: `Product ${action} successfully`,
      productId,
    });
  } catch (error) {
    logger.error("Webhook error", {
      error: error.message,
      stack: error.stack,
      body: req.body,
    });
    next(error);
  }
};

/**
 * Transform product data to Elasticsearch document format
 * (Reused from product.events.js logic)
 */
function transformProductToDocument(product) {
  const data = product.data || product;

  // Extract brand and category names
  const brandName =
    data.brandId?.name || data.brand?.name || data.brandName || "";
  const categoryName =
    data.categoryId?.name || data.category?.name || data.categoryName || "";

  // Build suggest field for autocomplete
  const suggest = [];
  if (data.name) suggest.push(data.name);
  if (brandName) suggest.push(brandName);
  if (data.sku) suggest.push(data.sku);
  if (data.specifications && typeof data.specifications === "object") {
    const specs = Object.values(data.specifications).slice(0, 5);
    suggest.push(...specs.filter((s) => typeof s === "string"));
  }

  // Extract image URL
  let imageUrl = null;
  if (data.images && Array.isArray(data.images) && data.images.length > 0) {
    const primaryImage =
      data.images.find((img) => img.isPrimary) || data.images[0];
    imageUrl = primaryImage?.url || primaryImage;
  }

  // Extract price
  const price =
    data.pricing?.currentPrice ||
    data.pricing?.originalPrice ||
    data.price ||
    0;
  const originalPrice = data.pricing?.originalPrice || data.price || price;

  // Extract inventory
  const inventory = data.inventory || {};
  const available = inventory.stock || inventory.available || 0;
  const inStock =
    inventory.isInStock !== undefined ? inventory.isInStock : available > 0;

  // Extract rating - handle both object and number formats
  let rating = 0;
  if (data.rating) {
    if (typeof data.rating === "object" && data.rating.average !== undefined) {
      rating = data.rating.average || 0;
    } else if (typeof data.rating === "number") {
      rating = data.rating;
    }
  }

  let reviewCount = 0;
  if (
    data.rating &&
    typeof data.rating === "object" &&
    data.rating.count !== undefined
  ) {
    reviewCount = data.rating.count || 0;
  } else if (data.reviewCount !== undefined) {
    reviewCount = data.reviewCount || 0;
  }

  // Extract slug
  const slug = data.seo?.slug || data.slug || "";

  return {
    _id: data._id?.toString() || data.id?.toString() || String(data.productId),
    id: data._id?.toString() || data.id?.toString() || String(data.productId),
    name: data.name || "",
    slug: slug,
    brand: brandName,
    brandId: data.brandId?._id?.toString() || data.brandId?.toString() || "",
    category: categoryName,
    categoryId:
      data.categoryId?._id?.toString() || data.categoryId?.toString() || "",
    type: data.type || "",
    description: data.description?.short || data.description || "",
    price: price,
    originalPrice: originalPrice,
    currency: data.currency || "VND",
    specs: Array.isArray(data.specifications)
      ? data.specifications
      : data.specifications
      ? Object.values(data.specifications)
      : [],
    specifications: data.specifications || {},
    suggest: suggest,
    status: data.status === "published" ? "active" : data.status || "inactive",
    inventory: {
      available: available,
      inStock: inStock,
    },
    popularity: data.analytics?.views || data.popularity || 0,
    rating: rating,
    reviewCount: reviewCount,
    image: imageUrl,
    images: Array.isArray(data.images)
      ? data.images.map((img) =>
          typeof img === "string" ? img : img?.url || ""
        )
      : [],
    tags: Array.isArray(data.tags)
      ? data.tags.map((t) => (typeof t === "string" ? t : t.name))
      : [],
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
  };
}

/**
 * Extract suggest keywords from products
 */
function extractSuggestKeywords(keyword, products) {
  const suggestions = new Set();
  const keywordLower = keyword.toLowerCase();

  // Extract unique keywords from product names
  products.forEach((product) => {
    if (product.name) {
      const words = product.name
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length >= 2 && word !== keywordLower);

      words.forEach((word) => {
        if (word.startsWith(keywordLower) || keywordLower.includes(word)) {
          suggestions.add(word);
        }
      });
    }
  });

  // Add brand names if they match
  products.forEach((product) => {
    if (product.brand && product.brand.toLowerCase().includes(keywordLower)) {
      suggestions.add(product.brand);
    }
  });

  return Array.from(suggestions).slice(0, 5);
}
