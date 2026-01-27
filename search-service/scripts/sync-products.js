require("dotenv").config();
const axios = require("axios");
const elasticsearchService = require("../src/services/elasticsearch.service");
const { testConnection } = require("../src/elastic/client");
const config = require("../src/config");
const logger = require("../src/utils/logger");

// Product Service client
const productServiceClient = axios.create({
  baseURL: config.productService.url,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Transform product data to Elasticsearch document format
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

  // Extract image URL - skip base64 strings
  let imageUrl = null;
  if (data.images && Array.isArray(data.images) && data.images.length > 0) {
    const primaryImage =
      data.images.find((img) => img.isPrimary) || data.images[0];
    const imageValue = primaryImage?.url || primaryImage;
    // Skip base64 encoded images (they're too large for Elasticsearch)
    if (imageValue && typeof imageValue === "string" && !imageValue.startsWith("data:")) {
      imageUrl = imageValue;
    }
  }
  // Also check data.image field
  if (!imageUrl && data.image) {
    if (typeof data.image === "string" && !data.image.startsWith("data:")) {
      imageUrl = data.image;
    }
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
      ? data.specifications.filter((s) => typeof s === "string")
      : data.specifications
      ? Object.values(data.specifications)
          .filter((s) => typeof s === "string")
          .flatMap((s) => (Array.isArray(s) ? s.filter((item) => typeof item === "string") : [s]))
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

// Fetch all products from Product Service with pagination
async function fetchAllProducts() {
  const allProducts = [];
  let page = 1;
  const limit = 100; // Fetch 100 products per page
  let hasMore = true;

  logger.info("Starting to fetch products from Product Service...");

  while (hasMore) {
    try {
      const response = await productServiceClient.get("/products", {
        params: {
          page,
          limit,
          status: "published", // Only fetch published products
        },
      });

      const result = response.data;
      const products = result.data || result.products || result.items || [];
      const total = result.total || result.totalItems || 0;
      const totalPages = result.totalPages || Math.ceil(total / limit);

      if (products.length === 0) {
        hasMore = false;
        break;
      }

      allProducts.push(...products);
      logger.info(
        `Fetched page ${page}/${totalPages}: ${products.length} products (Total: ${allProducts.length})`
      );

      if (page >= totalPages || products.length < limit) {
        hasMore = false;
      } else {
        page++;
      }

      // Small delay to avoid overwhelming the service
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        logger.error(
          `Cannot connect to Product Service at ${config.productService.url}`,
          {
            error: error.message,
            code: error.code,
            hint: "Please make sure Product Service is running and accessible",
          }
        );
        throw new Error(
          `Cannot connect to Product Service at ${config.productService.url}. ` +
            `Please check if Product Service is running. Error: ${error.message}`
        );
      }

      logger.error(`Error fetching products page ${page}:`, {
        error: error.message,
        code: error.code,
        url: `${config.productService.url}/products`,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }

  logger.info(`Total products fetched: ${allProducts.length}`);
  return allProducts;
}

// Sync products to Elasticsearch
async function syncProducts(replaceAll = false) {
  try {
    logger.info("Starting product sync to Elasticsearch...");

    // Test Elasticsearch connection
    const isConnected = await testConnection();
    if (!isConnected) {
      logger.error(
        "Cannot connect to Elasticsearch. Please check your configuration."
      );
      process.exit(1);
    }

    // Test Product Service connection
    try {
      const healthResponse = await productServiceClient.get("/health", {
        timeout: 5000,
      });
      logger.info("Product Service connection successful", {
        url: config.productService.url,
        status: healthResponse.status,
      });
    } catch (error) {
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        logger.error("Cannot connect to Product Service", {
          url: config.productService.url,
          error: error.message,
          code: error.code,
          hint: "Please make sure Product Service is running at the configured URL",
        });
        throw new Error(
          `Cannot connect to Product Service at ${config.productService.url}. ` +
            `Please check:\n` +
            `1. Product Service is running\n` +
            `2. URL is correct in .env file (PRODUCT_SERVICE_URL)\n` +
            `3. No firewall blocking the connection\n` +
            `Error: ${error.message}`
        );
      }
      logger.warn("Product Service health check failed, but continuing...", {
        error: error.message,
        code: error.code,
      });
    }

    // Fetch all products
    const products = await fetchAllProducts();

    if (products.length === 0) {
      logger.warn("No products found to sync");
      return;
    }

    // Transform products to Elasticsearch documents
    logger.info("Transforming products to Elasticsearch format...");
    const documents = products.map((product) => {
      const doc = transformProductToDocument(product);
      return {
        _id: doc._id,
        ...doc,
      };
    });

    // If replaceAll, delete existing index first
    if (replaceAll) {
      logger.info("Replacing all documents (deleting existing index)...");
      try {
        await elasticsearchService.deleteIndex();
        logger.info("Existing index deleted");

        // Recreate index
        const productIndexMapping = require("../src/models/product.index");
        await elasticsearchService.createIndex(productIndexMapping);
        logger.info("Index recreated");
      } catch (error) {
        logger.warn(
          "Error deleting/recreating index, continuing with update:",
          {
            error: error.message,
          }
        );
      }
    }

    // Index documents in batches
    const batchSize = 50;
    let indexed = 0;
    let failed = 0;

    logger.info(
      `Indexing ${documents.length} products in batches of ${batchSize}...`
    );

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);

      try {
        await elasticsearchService.bulkIndex(batch);
        indexed += batch.length;
        logger.info(
          `Indexed batch ${Math.floor(i / batchSize) + 1}: ${indexed}/${
            documents.length
          } products`
        );
      } catch (error) {
        logger.error(`Error indexing batch ${Math.floor(i / batchSize) + 1}:`, {
          error: error.message,
          batchSize: batch.length,
        });
        failed += batch.length;
      }
    }

    // Refresh index
    await elasticsearchService.refreshIndex();
    logger.info("Index refreshed");

    // Summary
    logger.info("Sync completed!", {
      total: documents.length,
      indexed,
      failed,
      successRate: `${((indexed / documents.length) * 100).toFixed(2)}%`,
    });

    if (failed > 0) {
      logger.warn(`${failed} products failed to index`);
    }
  } catch (error) {
    logger.error("Sync failed:", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const replaceAll = args.includes("--replace-all") || args.includes("-r");

  if (replaceAll) {
    logger.info("Mode: Replace all (will delete existing index)");
  } else {
    logger.info("Mode: Update existing (will update/create documents)");
  }

  await syncProducts(replaceAll);
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    logger.error("Unhandled error:", error);
    process.exit(1);
  });
}

module.exports = { syncProducts, transformProductToDocument };
