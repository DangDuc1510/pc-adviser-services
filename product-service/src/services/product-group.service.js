const productGroupRepository = require("../repositories/product-group.repository");
const productRepository = require("../repositories/product.repository");
const productGroupValidator = require("../validators/product-group.validator");
const {
  ValidationError,
  NotFoundError,
  ProductNotFoundError,
  ProductGroupNotFoundError,
} = require("../errors");

// Get all product groups with filters and pagination
const getAllProductGroups = async (queryParams) => {
  const { page, limit } =
    productGroupValidator.validatePaginationParams(queryParams);

  const filter = {};

  // Filter by type
  if (queryParams.type) {
    filter.type = queryParams.type;
  }

  // Filter by isActive
  if (queryParams.isActive !== undefined) {
    filter.isActive = queryParams.isActive === "true";
  }

  // Filter by createdBy
  if (queryParams.createdBy) {
    filter.createdBy = queryParams.createdBy;
  }

  // Filter by createdByRole - support single value, comma-separated, or array
  if (queryParams.createdByRole) {
    let roleArray = [];

    if (Array.isArray(queryParams.createdByRole)) {
      roleArray = queryParams.createdByRole;
    } else if (
      typeof queryParams.createdByRole === "string" &&
      queryParams.createdByRole.includes(",")
    ) {
      // Parse comma-separated string
      roleArray = queryParams.createdByRole
        .split(",")
        .map((role) => role.trim())
        .filter(
          (role) => role && ["customer", "admin", "employee"].includes(role)
        );
    } else {
      // Single value
      roleArray = [queryParams.createdByRole];
    }

    // Use $in operator for multiple roles, direct match for single role
    if (roleArray.length > 0) {
      filter.createdByRole =
        roleArray.length === 1 ? roleArray[0] : { $in: roleArray };
    }
  }

  // Search by name or description
  if (queryParams.search) {
    filter.$text = { $search: queryParams.search };
  }

  // Sort options
  let sort = { createdAt: -1 };
  if (queryParams.sort) {
    switch (queryParams.sort) {
      case "newest":
        sort = { createdAt: -1 };
        break;
      case "oldest":
        sort = { createdAt: 1 };
        break;
      case "price_asc":
        sort = { totalPrice: 1 };
        break;
      case "price_desc":
        sort = { totalPrice: -1 };
        break;
      case "name_asc":
        sort = { name: 1 };
        break;
      case "name_desc":
        sort = { name: -1 };
        break;
      case "views":
        sort = { views: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }
  }

  return await productGroupRepository.findWithPagination(filter, page, limit, {
    populate: [
      {
        path: "products.productId",
        populate: ["brandId", "categoryId"],
      },
      "products.categoryLevel0Id",
      "createdBy",
    ],
    sort,
  });
};

// Get product group by ID
const getProductGroupById = async (groupId) => {
  if (!groupId) {
    throw new ValidationError("ID nhóm sản phẩm là bắt buộc");
  }

  const group = await productGroupRepository.findById(groupId, {
    populate: [
      {
        path: "products.productId",
        populate: ["brandId", "categoryId"],
      },
      "products.categoryLevel0Id",
      "createdBy",
      "updatedBy",
    ],
  });

  if (!group) {
    throw new ProductGroupNotFoundError("Không tìm thấy nhóm sản phẩm");
  }

  // Increment view count
  await productGroupRepository.incrementViews(groupId);

  return group;
};

// Create new product group
const createProductGroup = async (groupData) => {
  const validatedData =
    productGroupValidator.validateCreateProductGroupData(groupData);

  // Auto-set type to "pc-config" if not provided (for PC configs from frontend)
  if (!validatedData.type) {
    validatedData.type = "pc-config";
  }

  // Ensure createdByRole is set (should be set by controller, but add as fallback)
  if (!validatedData.createdByRole) {
    validatedData.createdByRole = groupData.createdByRole || "customer";
  }

  // Validate all products exist and set categoryLevel0Id
  if (validatedData.products && validatedData.products.length > 0) {
    for (const item of validatedData.products) {
      const product = await productRepository.findById(item.productId);
      if (!product) {
        throw new ProductNotFoundError(
          `Không tìm thấy sản phẩm với ID: ${item.productId}`
        );
      }
      // Set categoryLevel0Id if not provided
      if (!item.categoryLevel0Id) {
        item.categoryLevel0Id = await productGroupRepository.findCategoryLevel0(
          product.categoryId
        );
        if (!item.categoryLevel0Id) {
          throw new ValidationError(
            `Không thể tìm thấy category level 0 cho sản phẩm: ${item.productId}`
          );
        }
      }
    }
  }
  console.log("validatedData", validatedData);

  const group = await productGroupRepository.create(validatedData);
  console.log("group", group);
  // Return populated group
  return await productGroupRepository.findById(group._id, {
    populate: [
      {
        path: "products.productId",
        populate: ["brandId", "categoryId"],
      },
      "createdBy",
    ],
  });
};

// Update product group
const updateProductGroup = async (groupId, updateData) => {
  if (!groupId) {
    throw new ValidationError("ID nhóm sản phẩm là bắt buộc");
  }

  const validatedData =
    productGroupValidator.validateUpdateProductGroupData(updateData);

  // Check if group exists
  const existingGroup = await productGroupRepository.findById(groupId);
  if (!existingGroup) {
    throw new NotFoundError("Không tìm thấy nhóm sản phẩm");
  }

  // Validate all products exist if updating products and set categoryLevel0Id
  if (validatedData.products && validatedData.products.length > 0) {
    for (const item of validatedData.products) {
      const product = await productRepository.findById(item.productId);
      if (!product) {
        throw new ProductNotFoundError(
          `Không tìm thấy sản phẩm với ID: ${item.productId}`
        );
      }
      // Set categoryLevel0Id if not provided
      if (!item.categoryLevel0Id) {
        item.categoryLevel0Id = await productGroupRepository.findCategoryLevel0(
          product.categoryId
        );
        if (!item.categoryLevel0Id) {
          throw new ValidationError(
            `Không thể tìm thấy category level 0 cho sản phẩm: ${item.productId}`
          );
        }
      }
    }
  }

  const updatedGroup = await productGroupRepository.updateById(
    groupId,
    validatedData
  );

  // Return populated group
  return await productGroupRepository.findById(groupId, {
    populate: [
      {
        path: "products.productId",
        populate: ["brandId", "categoryId"],
      },
      "products.categoryLevel0Id",
      "createdBy",
      "updatedBy",
    ],
  });
};

// Delete product group
const deleteProductGroup = async (groupId) => {
  if (!groupId) {
    throw new ValidationError("ID nhóm sản phẩm là bắt buộc");
  }

  const group = await productGroupRepository.findById(groupId);
  if (!group) {
    throw new ProductGroupNotFoundError("Không tìm thấy nhóm sản phẩm");
  }

  await productGroupRepository.deleteById(groupId);

  return { message: "Xóa nhóm sản phẩm thành công" };
};

// Add product to group
const addProductToGroup = async (groupId, productData) => {
  if (!groupId) {
    throw new ValidationError("ID nhóm sản phẩm là bắt buộc");
  }

  const validatedData =
    productGroupValidator.validateAddProductData(productData);

  // Check if group exists
  const group = await productGroupRepository.findById(groupId);
  if (!group) {
    throw new ProductGroupNotFoundError("Không tìm thấy nhóm sản phẩm");
  }

  // Check if product exists
  const product = await productRepository.findById(validatedData.productId);
  if (!product) {
    throw new ProductNotFoundError("Không tìm thấy sản phẩm");
  }

  // Get categoryLevel0Id if not provided
  let categoryLevel0Id = validatedData.categoryLevel0Id;
  if (!categoryLevel0Id) {
    categoryLevel0Id = await productGroupRepository.findCategoryLevel0(
      product.categoryId
    );
    if (!categoryLevel0Id) {
      throw new ValidationError(
        "Không thể tìm thấy category level 0 cho sản phẩm"
      );
    }
  }

  // Add product to group
  const updatedGroup = await productGroupRepository.addProduct(
    groupId,
    validatedData.productId,
    categoryLevel0Id,
    validatedData.quantity
  );

  return updatedGroup;
};

// Remove product from group
const removeProductFromGroup = async (groupId, productId) => {
  if (!groupId) {
    throw new ValidationError("ID nhóm sản phẩm là bắt buộc");
  }

  if (!productId) {
    throw new ValidationError("ID sản phẩm là bắt buộc");
  }

  // Check if group exists
  const group = await productGroupRepository.findById(groupId);
  if (!group) {
    throw new ProductGroupNotFoundError("Không tìm thấy nhóm sản phẩm");
  }

  // Remove product from group
  const updatedGroup = await productGroupRepository.removeProduct(
    groupId,
    productId
  );

  return updatedGroup;
};

// Update product quantity in group
const updateProductQuantityInGroup = async (groupId, productData) => {
  if (!groupId) {
    throw new ValidationError("ID nhóm sản phẩm là bắt buộc");
  }

  const validatedData =
    productGroupValidator.validateUpdateProductQuantityData(productData);

  // Check if group exists
  const group = await productGroupRepository.findById(groupId);
  if (!group) {
    throw new ProductGroupNotFoundError("Không tìm thấy nhóm sản phẩm");
  }

  // Update product quantity
  const updatedGroup = await productGroupRepository.updateProductQuantity(
    groupId,
    validatedData.productId,
    validatedData.quantity
  );

  return updatedGroup;
};

// Get public product groups
const getPublicProductGroups = async (queryParams = {}) => {
  const { limit = 20 } = queryParams;

  return await productGroupRepository.findPublic({
    populate: [
      {
        path: "products.productId",
        populate: ["brandId", "categoryId"],
      },
      "products.categoryLevel0Id",
      "createdBy",
    ],
    sort: { createdAt: -1 },
    limit: parseInt(limit),
  });
};

// Get product groups by user
const getProductGroupsByUser = async (userId, queryParams = {}) => {
  const { page, limit } =
    productGroupValidator.validatePaginationParams(queryParams);

  // Filter by userId, type="pc-config", and only customer-created configs
  // This ensures customers only see their own configs, not admin/employee configs
  const filter = {
    createdBy: userId,
    type: "pc-config",
    createdByRole: queryParams.createdByRole || "customer", // Default to customer role
  };

  return await productGroupRepository.findWithPagination(filter, page, limit, {
    populate: [
      {
        path: "products.productId",
        populate: ["brandId", "categoryId"],
      },
      "products.categoryLevel0Id",
      "createdBy",
    ],
    sort: { createdAt: -1 },
  });
};

// Toggle product group status
const toggleProductGroupStatus = async (groupId) => {
  if (!groupId) {
    throw new ValidationError("ID nhóm sản phẩm là bắt buộc");
  }

  const group = await productGroupRepository.findById(groupId);
  if (!group) {
    throw new ProductGroupNotFoundError("Không tìm thấy nhóm sản phẩm");
  }

  const updatedGroup = await productGroupRepository.updateById(groupId, {
    isActive: !group.isActive,
  });

  return updatedGroup;
};

module.exports = {
  getAllProductGroups,
  getProductGroupById,
  createProductGroup,
  updateProductGroup,
  deleteProductGroup,
  addProductToGroup,
  removeProductFromGroup,
  updateProductQuantityInGroup,
  getPublicProductGroups,
  getProductGroupsByUser,
  toggleProductGroupStatus,
};
