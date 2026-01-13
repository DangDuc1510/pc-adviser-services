const createBaseRepository = require("./base.repository");
const Category = require("../models/category.model");
const { DatabaseError } = require("../errors");

// Tạo base repository functions cho Category model
const baseRepo = createBaseRepository(Category);

// Find category by slug
const findBySlug = async (slug, options = {}) => {
  return await baseRepo.findOne({ slug }, options);
};

// Check if slug exists (excluding current category)
const slugExists = async (slug, excludeId = null) => {
  const filter = { slug };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  return await baseRepo.exists(filter);
};

// Find categories by component type
const findByComponentType = async (componentType, options = {}) => {
  return await baseRepo.find({ componentType, isActive: true }, options);
};

// Get category hierarchy (parent categories with children)
const getCategoryHierarchy = async () => {
  try {
    const categories = await baseRepo.find(
      { isActive: true },
      { sort: { sortOrder: 1, name: 1 } }
    );

    // Build hierarchy
    const categoryMap = new Map();
    const rootCategories = [];

    // First pass: create map and identify root categories
    categories.forEach((category) => {
      categoryMap.set(category._id.toString(), {
        ...category.toObject(),
        children: [],
      });

      if (!category.parentId) {
        rootCategories.push(categoryMap.get(category._id.toString()));
      }
    });

    // Second pass: build parent-child relationships
    categories.forEach((category) => {
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId.toString());
        if (parent) {
          parent.children.push(categoryMap.get(category._id.toString()));
        }
      }
    });

    return rootCategories;
  } catch (error) {
    throw new DatabaseError(
      `Error getting category hierarchy: ${error.message}`
    );
  }
};

// Find root categories (level 0)
const findRootCategories = async () => {
  return await baseRepo.find(
    {
      parentId: null,
      level: 0,
      isActive: true,
    },
    { sort: { sortOrder: 1, name: 1 } }
  );
};

// Find child categories by parent ID
const findByParentId = async (parentId) => {
  return await baseRepo.find(
    {
      parentId,
      isActive: true,
    },
    { sort: { sortOrder: 1, name: 1 } }
  );
};

// Get category with children count
const findWithProductCount = async () => {
  try {
    const pipeline = [
      { $match: { isActive: true } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "categoryId",
          as: "products",
        },
      },
      {
        $addFields: {
          productCount: { $size: "$products" },
        },
      },
      {
        $project: {
          products: 0, // Remove products array to keep response clean
        },
      },
      { $sort: { sortOrder: 1, name: 1 } },
    ];

    return await baseRepo.aggregate(pipeline);
  } catch (error) {
    throw new DatabaseError(
      `Error finding categories with product count: ${error.message}`
    );
  }
};

// Find categories with active products
const findWithActiveProducts = async () => {
  try {
    const pipeline = [
      { $match: { isActive: true } },
      {
        $lookup: {
          from: "products",
          let: { categoryId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$categoryId", "$$categoryId"] },
                isActive: true,
                status: "published",
              },
            },
          ],
          as: "products",
        },
      },
      {
        $match: {
          "products.0": { $exists: true }, // Only categories with products
        },
      },
      {
        $addFields: {
          productCount: { $size: "$products" },
        },
      },
      {
        $project: {
          products: 0,
        },
      },
      { $sort: { sortOrder: 1, name: 1 } },
    ];

    return await baseRepo.aggregate(pipeline);
  } catch (error) {
    throw new DatabaseError(
      `Error finding categories with active products: ${error.message}`
    );
  }
};

// Get categories with pagination and filters
const findWithPagination = async (
  filter = {},
  page = 1,
  limit = 20,
  options = {}
) => {
  try {
    const skip = (page - 1) * limit;
    const { sort = { sortOrder: 1, name: 1 } } = options;

    const [categories, total] = await Promise.all([
      baseRepo.find(filter, { sort, skip, limit }),
      baseRepo.count(filter),
    ]);

    return {
      categories,
      pagination: {
        current: page,
        pageSize: limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new DatabaseError(
      `Error finding categories with pagination: ${error.message}`
    );
  }
};

// Search categories by name
const searchByName = async (searchTerm, options = {}) => {
  const { limit = 20 } = options;
  const filter = {
    name: { $regex: searchTerm, $options: "i" },
    isActive: true,
  };

  return await baseRepo.find(filter, {
    sort: { name: 1 },
    limit,
  });
};

// Update sort order
const updateSortOrder = async (categoryId, sortOrder) => {
  try {
    return await baseRepo.updateById(categoryId, { sortOrder });
  } catch (error) {
    throw new DatabaseError(
      `Error updating category sort order: ${error.message}`
    );
  }
};

// Get category path (breadcrumb)
const getCategoryPath = async (categoryId) => {
  try {
    const category = await baseRepo.findById(categoryId);
    if (!category) {
      return [];
    }

    const path = [category];
    let currentCategory = category;

    while (currentCategory.parentId) {
      currentCategory = await baseRepo.findById(currentCategory.parentId);
      if (currentCategory) {
        path.unshift(currentCategory);
      } else {
        break;
      }
    }

    return path;
  } catch (error) {
    throw new DatabaseError(`Error getting category path: ${error.message}`);
  }
};

// Get all descendant category IDs (including the category itself and all its children recursively)
const getAllDescendantIds = async (categoryId) => {
  try {
    // Use $graphLookup to get all descendants recursively
    const mongoose = require("mongoose");
    const ObjectId = mongoose.Types.ObjectId.isValid(categoryId)
      ? new mongoose.Types.ObjectId(categoryId)
      : categoryId;

    const result = await Category.aggregate([
      {
        $match: { _id: ObjectId, isActive: true },
      },
      {
        $graphLookup: {
          from: "categories",
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "parentId",
          as: "descendants",
          restrictSearchWithMatch: { isActive: true },
        },
      },
      {
        $project: {
          _id: 1,
          descendantIds: {
            $concatArrays: [["$_id"], "$descendants._id"],
          },
        },
      },
    ]);

    if (result.length === 0) {
      // Category not found, return empty array or just the ID if it's valid
      return mongoose.Types.ObjectId.isValid(categoryId) ? [ObjectId] : [];
    }

    return result[0].descendantIds;
  } catch (error) {
    throw new DatabaseError(
      `Error getting descendant category IDs: ${error.message}`
    );
  }
};

module.exports = {
  // Base repository functions
  ...baseRepo,

  // Custom category repository functions
  findBySlug,
  slugExists,
  findByComponentType,
  getCategoryHierarchy,
  findRootCategories,
  findByParentId,
  findWithProductCount,
  findWithActiveProducts,
  findWithPagination,
  searchByName,
  updateSortOrder,
  getCategoryPath,
  getAllDescendantIds,
};
