const createBaseRepository = require("./base.repository");
const ProductGroup = require("../models/product-group.model");
const categoryRepository = require("./category.repository");
const { DatabaseError } = require("../errors");

const baseRepo = createBaseRepository(ProductGroup);

// Helper function to find category level 0 (root category)
const findCategoryLevel0 = async (categoryId) => {
  if (!categoryId) return null;

  try {
    const category = await categoryRepository.findById(categoryId);
    if (!category) return null;

    // If level is 0, return it
    if (category.level === 0) {
      return category._id;
    }

    // Traverse up the parent chain
    let currentCategory = category;
    while (currentCategory && currentCategory.parentId) {
      const parentCategory = await categoryRepository.findById(
        currentCategory.parentId
      );
      if (!parentCategory) break;

      if (parentCategory.level === 0) {
        return parentCategory._id;
      }
      currentCategory = parentCategory;
    }

    return null;
  } catch (error) {
    throw new DatabaseError(`Error finding category level 0: ${error.message}`);
  }
};

// Find product groups with pagination
const findWithPagination = async (
  filter = {},
  page = 1,
  limit = 20,
  options = {}
) => {
  try {
    const skip = (page - 1) * limit;
    const {
      populate = [
        "products.productId",
        "products.categoryLevel0Id",
        "createdBy",
      ],
      sort = { createdAt: -1 },
    } = options;

    const [groups, total] = await Promise.all([
      baseRepo.find(filter, { populate, sort, skip, limit }),
      baseRepo.count(filter),
    ]);

    return {
      groups,
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
      `Error finding product groups with pagination: ${error.message}`
    );
  }
};

// Find product groups by user
const findByUser = async (userId, options = {}) => {
  const filter = { createdBy: userId };
  return await baseRepo.find(filter, options);
};

// Find public product groups
const findPublic = async (options = {}) => {
  const filter = {
    isActive: true,
  };
  return await baseRepo.find(filter, options);
};

// Add product to group
const addProduct = async (
  groupId,
  productId,
  categoryLevel0Id,
  quantity = 1
) => {
  try {
    const group = await ProductGroup.findById(groupId);
    if (!group) {
      throw new DatabaseError("Product group not found");
    }

    // If categoryLevel0Id is not provided, find it from product
    let finalCategoryLevel0Id = categoryLevel0Id;
    if (!finalCategoryLevel0Id) {
      const productRepository = require("./product.repository");
      const product = await productRepository.findById(productId);
      if (!product) {
        throw new DatabaseError("Product not found");
      }
      finalCategoryLevel0Id = await findCategoryLevel0(product.categoryId);
      if (!finalCategoryLevel0Id) {
        throw new DatabaseError("Could not find category level 0 for product");
      }
    }

    // Check if product already exists in group
    const existingProductIndex = group.products.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    if (existingProductIndex >= 0) {
      // Update quantity if product already exists
      group.products[existingProductIndex].quantity += quantity;
      group.products[existingProductIndex].categoryLevel0Id =
        finalCategoryLevel0Id;
    } else {
      // Add new product
      group.products.push({
        productId,
        categoryLevel0Id: finalCategoryLevel0Id,
        quantity,
      });
    }

    await group.save();
    return await ProductGroup.findById(groupId).populate([
      "products.productId",
      "products.categoryLevel0Id",
    ]);
  } catch (error) {
    throw new DatabaseError(`Error adding product to group: ${error.message}`);
  }
};

// Remove product from group
const removeProduct = async (groupId, productId) => {
  try {
    const group = await ProductGroup.findById(groupId);
    if (!group) {
      throw new DatabaseError("Product group not found");
    }

    group.products = group.products.filter(
      (item) => item.productId.toString() !== productId.toString()
    );

    await group.save();
    return await ProductGroup.findById(groupId).populate([
      "products.productId",
      "products.categoryLevel0Id",
    ]);
  } catch (error) {
    throw new DatabaseError(
      `Error removing product from group: ${error.message}`
    );
  }
};

// Update product quantity in group
const updateProductQuantity = async (groupId, productId, quantity) => {
  try {
    const group = await ProductGroup.findById(groupId);
    if (!group) {
      throw new DatabaseError("Product group not found");
    }

    const productItem = group.products.find(
      (item) => item.productId.toString() === productId.toString()
    );

    if (!productItem) {
      throw new DatabaseError("Product not found in group");
    }

    if (quantity <= 0) {
      // Remove product if quantity is 0 or less
      return await removeProduct(groupId, productId);
    }

    productItem.quantity = quantity;

    await group.save();
    return await ProductGroup.findById(groupId).populate([
      "products.productId",
      "products.categoryLevel0Id",
    ]);
  } catch (error) {
    throw new DatabaseError(
      `Error updating product quantity: ${error.message}`
    );
  }
};

// Increment views
const incrementViews = async (groupId) => {
  try {
    return await ProductGroup.findByIdAndUpdate(
      groupId,
      { $inc: { views: 1 } },
      { new: true }
    );
  } catch (error) {
    throw new DatabaseError(`Error incrementing group views: ${error.message}`);
  }
};

module.exports = {
  // Base repository functions
  ...baseRepo,

  // Custom product group repository functions
  findWithPagination,
  findByUser,
  findPublic,
  addProduct,
  removeProduct,
  updateProductQuantity,
  incrementViews,
  findCategoryLevel0,
};
