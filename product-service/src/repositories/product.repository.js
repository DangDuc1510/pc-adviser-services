const createBaseRepository = require("./base.repository");
const Product = require("../models/product.model");
const { DatabaseError } = require("../errors");

// Tạo base repository functions cho Product model
const baseRepo = createBaseRepository(Product);

// Find product by SKU
const findBySKU = async (sku, options = {}) => {
  return await baseRepo.findOne({ sku }, options);
};

// Find product by slug
const findBySlug = async (slug, options = {}) => {
  return await baseRepo.findOne({ "seo.slug": slug }, options);
};

// Check if SKU exists (excluding current product)
const skuExists = async (sku, excludeId = null) => {
  const filter = { sku };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  return await baseRepo.exists(filter);
};

// Check if slug exists (excluding current product)
const slugExists = async (slug, excludeId = null) => {
  const filter = { "seo.slug": slug };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  return await baseRepo.exists(filter);
};

// Get products with pagination and filters
const findWithPagination = async (
  filter = {},
  page = 1,
  limit = 20,
  options = {}
) => {
  try {
    const skip = (page - 1) * limit;
    const { populate = ["brandId", "categoryId"], sort = { createdAt: -1 } } =
      options;

    const [products, total] = await Promise.all([
      baseRepo.find(filter, { populate, sort, skip, limit }),
      baseRepo.count(filter),
    ]);

    return {
      products,
      pagination: {
        page: page,
        current: page,
        limit: limit,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new DatabaseError(
      `Error finding products with pagination: ${error.message}`
    );
  }
};

// Text search products
const searchProducts = async (searchQuery, options = {}) => {
  try {
    const { limit = 20, categoryId, brandId, minPrice, maxPrice } = options;

    const filter = {
      $text: { $search: searchQuery },
      isActive: true,
      status: "published",
      $expr: {
        $gt: [
          { $subtract: ["$inventory.stock", { $ifNull: ["$inventory.reservedStock", 0] }] },
          0
        ]
      }
    };

    if (categoryId) filter.categoryId = categoryId;
    if (brandId) filter.brandId = brandId;

    if (minPrice || maxPrice) {
      filter["pricing.originalPrice"] = {};
      if (minPrice) filter["pricing.originalPrice"].$gte = parseFloat(minPrice);
      if (maxPrice) filter["pricing.originalPrice"].$lte = parseFloat(maxPrice);
    }

    return await baseRepo.find(filter, {
      populate: ["brandId", "categoryId"],
      sort: { score: { $meta: "textScore" }, createdAt: -1 },
      limit: parseInt(limit),
    });
  } catch (error) {
    throw new DatabaseError(`Error searching products: ${error.message}`);
  }
};

// Get featured products
const findFeatured = async (options = {}) => {
  const { limit = 10, categoryId } = options;
  const filter = {
    isFeatured: true,
    isActive: true,
    status: "published",
    $expr: {
      $gt: [
        { $subtract: ["$inventory.stock", { $ifNull: ["$inventory.reservedStock", 0] }] },
        0
      ]
    }
  };

  if (categoryId) {
    filter.categoryId = categoryId;
  }

  return await baseRepo.find(filter, {
    populate: ["brandId", "categoryId"],
    sort: { createdAt: -1 },
    limit: parseInt(limit),
  });
};

// Get products on sale
const findOnSale = async (page = 1, limit = 20) => {
  const filter = {
    "pricing.isOnSale": true,
    isActive: true,
    status: "published",
    $expr: {
      $gt: [
        { $subtract: ["$inventory.stock", { $ifNull: ["$inventory.reservedStock", 0] }] },
        0
      ]
    }
  };

  return await findWithPagination(filter, page, limit, {
    sort: { "pricing.discountPercent": -1, createdAt: -1 },
  });
};

// Find products by category
const findByCategory = async (categoryId, options = {}) => {
  const filter = { categoryId, isActive: true, status: "published" };
  return await baseRepo.find(filter, options);
};

// Find products by brand
const findByBrand = async (brandId, options = {}) => {
  const filter = { brandId, isActive: true, status: "published" };
  return await baseRepo.find(filter, options);
};

// Update stock
const updateStock = async (productId, stock, reservedStock = 0) => {
  try {
    const updateData = {
      "inventory.stock": stock,
      "inventory.reservedStock": reservedStock,
      "inventory.isInStock": stock > 0,
    };

    return await baseRepo.updateById(productId, updateData);
  } catch (error) {
    throw new DatabaseError(`Error updating product stock: ${error.message}`);
  }
};

// Increment view count
const incrementViews = async (productId) => {
  try {
    return await Product.findByIdAndUpdate(
      productId,
      { $inc: { views: 1 } },
      { new: true }
    );
  } catch (error) {
    throw new DatabaseError(
      `Error incrementing product views: ${error.message}`
    );
  }
};

// Increment sales count
const incrementSales = async (productId, quantity = 1) => {
  try {
    return await Product.findByIdAndUpdate(
      productId,
      { $inc: { sales: quantity } },
      { new: true }
    );
  } catch (error) {
    throw new DatabaseError(
      `Error incrementing product sales: ${error.message}`
    );
  }
};

// Update rating
const updateRating = async (productId, averageRating, ratingCount) => {
  try {
    const updateData = {
      "rating.average": averageRating,
      "rating.count": ratingCount,
    };

    return await baseRepo.updateById(productId, updateData);
  } catch (error) {
    throw new DatabaseError(`Error updating product rating: ${error.message}`);
  }
};

// Get low stock products
const findLowStock = async (threshold = 10) => {
  const filter = {
    "inventory.stock": { $lte: threshold },
    "inventory.stock": { $gt: 0 },
    isActive: true,
    status: "published",
  };

  return await baseRepo.find(filter, {
    populate: ["brandId", "categoryId"],
    sort: { "inventory.stock": 1 },
  });
};

// Get out of stock products
const findOutOfStock = async () => {
  const filter = {
    "inventory.stock": 0,
    isActive: true,
    status: "published",
  };

  return await baseRepo.find(filter, {
    populate: ["brandId", "categoryId"],
    sort: { updatedAt: -1 },
  });
};

// Get products by price range
const findByPriceRange = async (minPrice, maxPrice, options = {}) => {
  const filter = {
    "pricing.originalPrice": {},
    isActive: true,
    status: "published",
    $expr: {
      $gt: [
        { $subtract: ["$inventory.stock", { $ifNull: ["$inventory.reservedStock", 0] }] },
        0
      ]
    }
  };

  if (minPrice) filter["pricing.originalPrice"].$gte = parseFloat(minPrice);
  if (maxPrice) filter["pricing.originalPrice"].$lte = parseFloat(maxPrice);

  return await baseRepo.find(filter, options);
};

// Get related products (same category, different brand or vice versa)
const findRelatedProducts = async (
  productId,
  categoryId,
  brandId,
  limit = 8
) => {
  const filter = {
    _id: { $ne: productId },
    $or: [{ categoryId: categoryId }, { brandId: brandId }],
    isActive: true,
    status: "published",
    $expr: {
      $gt: [
        { $subtract: ["$inventory.stock", { $ifNull: ["$inventory.reservedStock", 0] }] },
        0
      ]
    }
  };

  return await baseRepo.find(filter, {
    populate: ["brandId", "categoryId"],
    sort: { rating: -1, sales: -1 },
    limit,
  });
};

// Get price range (min/max) for filtering
const getPriceRange = async (filter = {}) => {
  try {
    const baseFilter = {
      ...filter,
      isActive: true,
      status: "published",
      $expr: {
        $gt: [
          { $subtract: ["$inventory.stock", { $ifNull: ["$inventory.reservedStock", 0] }] },
          0
        ]
      }
    };

    const [minResult, maxResult] = await Promise.all([
      Product.findOne(baseFilter, { "pricing.originalPrice": 1 })
        .sort({ "pricing.originalPrice": 1 })
        .lean(),
      Product.findOne(baseFilter, { "pricing.originalPrice": 1 })
        .sort({ "pricing.originalPrice": -1 })
        .lean(),
    ]);

    return {
      minPrice: minResult?.pricing?.originalPrice || 0,
      maxPrice: maxResult?.pricing?.originalPrice || 0,
    };
  } catch (error) {
    throw new DatabaseError(`Error getting price range: ${error.message}`);
  }
};

module.exports = {
  // Base repository functions
  ...baseRepo,

  // Custom product repository functions
  findBySKU,
  findBySlug,
  skuExists,
  slugExists,
  findWithPagination,
  searchProducts,
  findFeatured,
  findOnSale,
  findByCategory,
  findByBrand,
  updateStock,
  incrementViews,
  incrementSales,
  updateRating,
  findLowStock,
  findOutOfStock,
  findByPriceRange,
  findRelatedProducts,
  getPriceRange,
};
