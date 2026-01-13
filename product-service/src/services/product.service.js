const productRepository = require("../repositories/product.repository");
const brandRepository = require("../repositories/brand.repository");
const categoryRepository = require("../repositories/category.repository");
const productValidator = require("../validators/product.validator");
const mongoose = require("mongoose");
const {
  ProductNotFoundError,
  BrandNotFoundError,
  CategoryNotFoundError,
  SKUExistsError,
  SlugExistsError,
  ValidationError,
} = require("../errors");
const searchClient = require("./search-client");

// Generate SKU if not provided
const generateSKU = (brandName, categoryName, productName) => {
  const brandCode = brandName.substring(0, 3).toUpperCase();
  const categoryCode = categoryName.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  return `${brandCode}-${categoryCode}-${timestamp}`;
};

// Get all products with filters and pagination
const getAllProducts = async (queryParams) => {
  // If categoryId is provided, expand it to include all descendant categories
  const expandedParams = { ...queryParams };
  if (queryParams.categoryId) {
    try {
      // Handle multiple categoryIds (comma-separated or array)
      let categoryIds = [];
      if (Array.isArray(queryParams.categoryId)) {
        categoryIds = queryParams.categoryId;
      } else if (
        typeof queryParams.categoryId === "string" &&
        queryParams.categoryId.includes(",")
      ) {
        categoryIds = queryParams.categoryId.split(",").map((id) => id.trim());
      } else {
        categoryIds = [queryParams.categoryId];
      }

      // Get all descendant IDs for each categoryId
      const allCategoryIds = new Set();
      for (const categoryId of categoryIds) {
        if (mongoose.Types.ObjectId.isValid(categoryId)) {
          const descendantIds = await categoryRepository.getAllDescendantIds(
            categoryId
          );
          // Keep ObjectId format for proper MongoDB filtering
          descendantIds.forEach((id) => {
            const idString = id.toString();
            if (!allCategoryIds.has(idString)) {
              allCategoryIds.add(idString);
            }
          });
        }
      }

      // Replace categoryId with expanded array (as strings, MongoDB will auto-convert)
      if (allCategoryIds.size > 0) {
        expandedParams.categoryId = Array.from(allCategoryIds);
      }
    } catch (error) {
      // If error getting descendants, use original categoryId
      console.error("Error expanding category IDs:", error.message);
    }
  }

  const { page, limit } =
    productValidator.validatePaginationParams(expandedParams);
  const filter = productValidator.validateSearchParams(expandedParams);

  // Build sort options
  // Support both old format (sortBy + sortOrder) and new format (sort)
  let sort = {};
  const sortParam = queryParams.sort || queryParams.sortBy;

  if (sortParam) {
    // Map frontend sort values to MongoDB sort fields
    switch (sortParam) {
      case "newest":
        sort = { createdAt: -1 };
        break;
      case "price_asc":
        sort = { "pricing.originalPrice": 1 };
        break;
      case "price_desc":
        sort = { "pricing.originalPrice": -1 };
        break;
      case "best_selling":
        sort = { sales: -1, "pricing.originalPrice": 1 }; // Sort by sales desc, then price asc
        break;
      case "rating":
        sort = { "rating.average": -1, "rating.count": -1 }; // Sort by average rating desc, then count desc
        break;
      default:
        // Fallback to old format if sortOrder is provided
        const { sortOrder = "desc" } = queryParams;
        sort[sortParam] = sortOrder === "desc" ? -1 : 1;
        break;
    }
  } else {
    // Default sort: newest first
    sort = { createdAt: -1 };
  }

  return await productRepository.findWithPagination(filter, page, limit, {
    populate: ["brandId", "categoryId"],
    sort,
  });
};

// Get product by ID
const getProductById = async (productId) => {
  if (!productId) {
    throw new ValidationError("ID sản phẩm là bắt buộc");
  }

  const product = await productRepository.findById(productId, {
    populate: ["brandId", "categoryId"],
  });

  if (!product) {
    throw new ProductNotFoundError("Không tìm thấy sản phẩm");
  }

  // Increment view count
  await productRepository.incrementViews(productId);

  return product;
};

// Get product by slug
const getProductBySlug = async (slug) => {
  if (!slug) {
    throw new ValidationError("Slug sản phẩm là bắt buộc");
  }

  const product = await productRepository.findBySlug(slug, {
    populate: ["brandId", "categoryId"],
  });

  if (!product) {
    throw new ProductNotFoundError("Không tìm thấy sản phẩm");
  }

  // Increment view count
  await productRepository.incrementViews(product._id);

  return product;
};

// Get featured products
const getFeaturedProducts = async (queryParams = {}) => {
  const { limit = 10, categoryId } = queryParams;

  return await productRepository.findFeatured({
    limit: parseInt(limit),
    categoryId,
  });
};

// Get products on sale
const getOnSaleProducts = async (queryParams = {}) => {
  const { page = 1, limit = 20 } = queryParams;

  return await productRepository.findOnSale(parseInt(page), parseInt(limit));
};

// Search products
const searchProducts = async (queryParams) => {
  const {
    q,
    categoryId,
    brandId,
    minPrice,
    maxPrice,
    limit = 20,
  } = queryParams;

  if (!q || typeof q !== "string") {
    throw new ValidationError("Từ khóa tìm kiếm là bắt buộc");
  }

  const searchTerm = q.trim();
  if (searchTerm.length < 2) {
    throw new ValidationError("Từ khóa tìm kiếm phải có ít nhất 2 ký tự");
  }

  return await productRepository.searchProducts(searchTerm, {
    limit: parseInt(limit),
    categoryId,
    brandId,
    minPrice,
    maxPrice,
  });
};

// Create new product
const createProduct = async (productData) => {
  const validatedData = productValidator.validateCreateProductData(productData);

  // Validate brand exists
  const brand = await brandRepository.findById(validatedData.brandId);
  if (!brand) {
    throw new BrandNotFoundError("Không tìm thấy thương hiệu");
  }

  // Validate category exists
  const category = await categoryRepository.findById(validatedData.categoryId);
  if (!category) {
    throw new CategoryNotFoundError("Không tìm thấy danh mục");
  }

  // Generate SKU if not provided
  if (!validatedData.sku) {
    validatedData.sku = generateSKU(
      brand.name,
      category.name,
      validatedData.name
    );
  }

  // Check SKU uniqueness
  const existingSKU = await productRepository.skuExists(validatedData.sku);
  if (existingSKU) {
    throw new SKUExistsError(`Mã SKU "${validatedData.sku}" đã tồn tại`);
  }

  // Check slug uniqueness
  const existingSlug = await productRepository.slugExists(
    validatedData.seo.slug
  );
  if (existingSlug) {
    throw new SlugExistsError(`Slug "${validatedData.seo.slug}" đã tồn tại`);
  }

  // Set primary image
  if (validatedData.images && validatedData.images.length > 0) {
    validatedData.images[0].isPrimary = true;
  }

  // Create product
  const product = await productRepository.create(validatedData);

  // Populate and return
  const populatedProduct = await productRepository.findById(product._id, {
    populate: ["brandId", "categoryId"],
  });

  // Notify search service (non-blocking)
  searchClient.notifyProductCreated(populatedProduct).catch((err) => {
    console.error(
      "Failed to notify search service on product create:",
      err.message
    );
  });

  return populatedProduct;
};

// Update product
const updateProduct = async (productId, updateData) => {
  if (!productId) {
    throw new ValidationError("ID sản phẩm là bắt buộc");
  }

  const validatedData = productValidator.validateUpdateProductData(updateData);

  // Check if product exists
  const existingProduct = await productRepository.findById(productId);
  if (!existingProduct) {
    throw new ProductNotFoundError("Không tìm thấy sản phẩm");
  }

  // Validate brand if provided
  if (validatedData.brandId) {
    const brand = await brandRepository.findById(validatedData.brandId);
    if (!brand) {
      throw new BrandNotFoundError("Không tìm thấy thương hiệu");
    }
  }

  // Validate category if provided
  if (validatedData.categoryId) {
    const category = await categoryRepository.findById(
      validatedData.categoryId
    );
    if (!category) {
      throw new CategoryNotFoundError("Không tìm thấy danh mục");
    }
  }

  // Check SKU uniqueness if updating SKU
  if (validatedData.sku && validatedData.sku !== existingProduct.sku) {
    const existingSKU = await productRepository.skuExists(
      validatedData.sku,
      productId
    );
    if (existingSKU) {
      throw new SKUExistsError(`Mã SKU "${validatedData.sku}" đã tồn tại`);
    }
  }

  // Check slug uniqueness if updating slug
  if (
    validatedData.seo?.slug &&
    validatedData.seo.slug !== existingProduct.seo?.slug
  ) {
    const existingSlug = await productRepository.slugExists(
      validatedData.seo.slug,
      productId
    );
    if (existingSlug) {
      throw new SlugExistsError(`Slug "${validatedData.seo.slug}" đã tồn tại`);
    }
  }

  // Update product
  const updatedProduct = await productRepository.updateById(
    productId,
    validatedData
  );

  // Return populated product
  const populatedProduct = await productRepository.findById(productId, {
    populate: ["brandId", "categoryId"],
  });

  // Notify search service (non-blocking)
  searchClient.notifyProductUpdated(populatedProduct).catch((err) => {
    console.error(
      "Failed to notify search service on product update:",
      err.message
    );
  });

  return populatedProduct;
};

// Update product stock
const updateProductStock = async (productId, stockData) => {
  if (!productId) {
    throw new ValidationError("ID sản phẩm là bắt buộc");
  }

  const validatedData = productValidator.validateStockUpdateData(stockData);

  const product = await productRepository.findById(productId);
  if (!product) {
    throw new ProductNotFoundError("Không tìm thấy sản phẩm");
  }

  const updatedProduct = await productRepository.updateStock(
    productId,
    validatedData.stock,
    validatedData.reservedStock
  );

  // Notify search service about stock update (non-blocking)
  // Get populated product to send full data
  const populatedProduct = await productRepository.findById(productId, {
    populate: ["brandId", "categoryId"],
  });
  if (populatedProduct) {
    searchClient.notifyProductUpdated(populatedProduct).catch((err) => {
      console.error(
        "Failed to notify search service on stock update:",
        err.message
      );
    });
  }

  return updatedProduct;
};

// Toggle product status (active/inactive)
const toggleProductStatus = async (productId) => {
  if (!productId) {
    throw new ValidationError("ID sản phẩm là bắt buộc");
  }

  const product = await productRepository.findById(productId);
  if (!product) {
    throw new ProductNotFoundError("Không tìm thấy sản phẩm");
  }

  const updatedProduct = await productRepository.updateById(productId, {
    isActive: !product.isActive,
  });

  return updatedProduct;
};

// Toggle featured status
const toggleFeaturedStatus = async (productId) => {
  if (!productId) {
    throw new ValidationError("ID sản phẩm là bắt buộc");
  }

  const product = await productRepository.findById(productId);
  if (!product) {
    throw new ProductNotFoundError("Không tìm thấy sản phẩm");
  }

  const updatedProduct = await productRepository.updateById(productId, {
    isFeatured: !product.isFeatured,
  });

  return updatedProduct;
};

// Delete product
const deleteProduct = async (productId) => {
  if (!productId) {
    throw new ValidationError("ID sản phẩm là bắt buộc");
  }

  const product = await productRepository.findById(productId);
  if (!product) {
    throw new ProductNotFoundError("Không tìm thấy sản phẩm");
  }

  await productRepository.deleteById(productId);

  // Notify search service (non-blocking)
  searchClient.notifyProductDeleted(productId).catch((err) => {
    console.error(
      "Failed to notify search service on product delete:",
      err.message
    );
  });

  return { message: "Xóa sản phẩm thành công" };
};

// Bulk operations
const bulkUpdateStatus = async (productIds, isActive) => {
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw new ValidationError("Danh sách ID sản phẩm là bắt buộc");
  }

  if (typeof isActive !== "boolean") {
    throw new ValidationError("Trạng thái phải là true hoặc false");
  }

  const result = await productRepository.updateMany(
    { _id: { $in: productIds } },
    { isActive }
  );

  return {
    message: `Đã cập nhật trạng thái ${result.modifiedCount} sản phẩm`,
    modifiedCount: result.modifiedCount,
  };
};

const bulkDelete = async (productIds) => {
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw new ValidationError("Danh sách ID sản phẩm là bắt buộc");
  }

  const result = await productRepository.deleteMany({
    _id: { $in: productIds },
  });

  return {
    message: `Đã xóa ${result.deletedCount} sản phẩm`,
    deletedCount: result.deletedCount,
  };
};

// Get related products
const getRelatedProducts = async (productId, limit = 8) => {
  const product = await productRepository.findById(productId);
  if (!product) {
    throw new ProductNotFoundError("Không tìm thấy sản phẩm");
  }

  return await productRepository.findRelatedProducts(
    productId,
    product.categoryId,
    product.brandId,
    limit
  );
};

// Get low stock products
const getLowStockProducts = async (threshold = 10) => {
  return await productRepository.findLowStock(threshold);
};

// Get out of stock products
const getOutOfStockProducts = async () => {
  return await productRepository.findOutOfStock();
};

// Get products by price range
const getProductsByPriceRange = async (
  minPrice,
  maxPrice,
  queryParams = {}
) => {
  const { page = 1, limit = 20 } = queryParams;

  const products = await productRepository.findByPriceRange(
    minPrice,
    maxPrice,
    {
      populate: ["brandId", "categoryId"],
      skip: (page - 1) * limit,
      limit: parseInt(limit),
      sort: { "pricing.originalPrice": 1 },
    }
  );

  return products;
};

// Update product rating
const updateProductRating = async (productId, averageRating, ratingCount) => {
  return await productRepository.updateRating(
    productId,
    averageRating,
    ratingCount
  );
};

// Get price range (min/max) for filtering
const getPriceRange = async (queryParams = {}) => {
  const filter = productValidator.validateSearchParams(queryParams);
  return await productRepository.getPriceRange(filter);
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductBySlug,
  getFeaturedProducts,
  getOnSaleProducts,
  searchProducts,
  createProduct,
  updateProduct,
  updateProductStock,
  toggleProductStatus,
  toggleFeaturedStatus,
  deleteProduct,
  bulkUpdateStatus,
  bulkDelete,
  getRelatedProducts,
  getLowStockProducts,
  getOutOfStockProducts,
  getProductsByPriceRange,
  updateProductRating,
  getPriceRange,
};
