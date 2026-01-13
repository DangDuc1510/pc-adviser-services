const { ValidationError } = require("../errors");
const { VALIDATION, PAGINATION } = require("../constants");

// Validate product group name
const validateName = (name) => {
  if (!name || typeof name !== "string") {
    throw new ValidationError("Tên nhóm sản phẩm là bắt buộc");
  }

  const trimmedName = name.trim();
  if (trimmedName.length < VALIDATION.NAME_MIN_LENGTH) {
    throw new ValidationError(
      `Tên nhóm sản phẩm phải có ít nhất ${VALIDATION.NAME_MIN_LENGTH} ký tự`
    );
  }

  if (trimmedName.length > VALIDATION.NAME_MAX_LENGTH) {
    throw new ValidationError(
      `Tên nhóm sản phẩm không được vượt quá ${VALIDATION.NAME_MAX_LENGTH} ký tự`
    );
  }

  return trimmedName;
};

// Validate description
const validateDescription = (description, isRequired = false) => {
  if (!description) {
    if (isRequired) {
      throw new ValidationError("Mô tả là bắt buộc");
    }
    return undefined;
  }

  if (typeof description !== "string") {
    throw new ValidationError("Mô tả phải là chuỗi văn bản");
  }

  const trimmedDescription = description.trim();
  if (trimmedDescription.length > VALIDATION.DESCRIPTION_MAX_LENGTH) {
    throw new ValidationError(
      `Mô tả không được vượt quá ${VALIDATION.DESCRIPTION_MAX_LENGTH} ký tự`
    );
  }

  return trimmedDescription;
};

// Validate short description
const validateShortDescription = (shortDescription) => {
  if (!shortDescription) {
    return undefined;
  }

  if (typeof shortDescription !== "string") {
    throw new ValidationError("Mô tả ngắn phải là chuỗi văn bản");
  }

  const trimmedDescription = shortDescription.trim();
  if (trimmedDescription.length > VALIDATION.SHORT_DESCRIPTION_MAX_LENGTH) {
    throw new ValidationError(
      `Mô tả ngắn không được vượt quá ${VALIDATION.SHORT_DESCRIPTION_MAX_LENGTH} ký tự`
    );
  }

  return trimmedDescription;
};

// Validate type
const validateType = (type) => {
  const validTypes = ["combo", "pc-config"];
  if (type && !validTypes.includes(type)) {
    throw new ValidationError(
      `Loại không hợp lệ. Chỉ chấp nhận: ${validTypes.join(", ")}`
    );
  }
  return type;
};

// Validate product item
const validateProductItem = (item) => {
  if (!item.productId) {
    throw new ValidationError("ID sản phẩm là bắt buộc");
  }

  if (typeof item.quantity !== "number" || item.quantity < 1) {
    throw new ValidationError("Số lượng sản phẩm phải là số nguyên dương");
  }

  if (item.quantity > 100) {
    throw new ValidationError("Số lượng sản phẩm không được vượt quá 100");
  }

  const validated = {
    productId: item.productId,
    quantity: Math.floor(item.quantity),
  };

  // categoryLevel0Id is optional - will be auto-filled from product if not provided
  if (item.categoryLevel0Id) {
    validated.categoryLevel0Id = item.categoryLevel0Id;
  }

  return validated;
};

// Validate products array
const validateProducts = (products) => {
  if (!Array.isArray(products)) {
    throw new ValidationError("Danh sách sản phẩm phải là một mảng");
  }

  if (products.length === 0) {
    return [];
  }

  if (products.length > 50) {
    throw new ValidationError("Một nhóm không được có quá 50 sản phẩm");
  }

  return products.map((item, index) => {
    try {
      return validateProductItem(item);
    } catch (error) {
      throw new ValidationError(
        `Lỗi ở sản phẩm thứ ${index + 1}: ${error.message}`
      );
    }
  });
};

// Validate pagination params
const validatePaginationParams = (params) => {
  let page = parseInt(params.page) || PAGINATION.DEFAULT_PAGE;
  let limit = parseInt(params.limit) || PAGINATION.DEFAULT_LIMIT;

  if (page < 1) {
    page = PAGINATION.DEFAULT_PAGE;
  }

  if (limit < 1) {
    limit = PAGINATION.DEFAULT_LIMIT;
  }

  if (limit > PAGINATION.MAX_LIMIT) {
    limit = PAGINATION.MAX_LIMIT;
  }

  return { page, limit };
};

// Validate create product group data
const validateCreateProductGroupData = (data) => {
  const validated = {
    name: validateName(data.name),
  };

  if (data.description !== undefined) {
    validated.description = validateDescription(data.description);
  }

  if (data.shortDescription !== undefined) {
    validated.shortDescription = validateShortDescription(
      data.shortDescription
    );
  }

  if (data.products !== undefined) {
    validated.products = validateProducts(data.products);
  }

  if (data.type !== undefined) {
    validated.type = validateType(data.type);
  }

  if (data.isActive !== undefined) {
    if (typeof data.isActive !== "boolean") {
      throw new ValidationError("isActive phải là true hoặc false");
    }
    validated.isActive = data.isActive;
  }

  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      throw new ValidationError("Tags phải là một mảng");
    }
    validated.tags = data.tags
      .filter((tag) => typeof tag === "string" && tag.trim().length > 0)
      .map((tag) => tag.trim())
      .slice(0, 20); // Limit to 20 tags
  }

  if (data.createdBy !== undefined) {
    validated.createdBy = data.createdBy;
  }

  if (data.createdByRole !== undefined) {
    const validRoles = ["customer", "admin", "employee"];
    if (!validRoles.includes(data.createdByRole)) {
      throw new ValidationError(
        `createdByRole không hợp lệ. Chỉ chấp nhận: ${validRoles.join(", ")}`
      );
    }
    validated.createdByRole = data.createdByRole;
  }

  return validated;
};

// Validate update product group data
const validateUpdateProductGroupData = (data) => {
  const validated = {};

  if (data.name !== undefined) {
    validated.name = validateName(data.name);
  }

  if (data.description !== undefined) {
    validated.description = validateDescription(data.description);
  }

  if (data.shortDescription !== undefined) {
    validated.shortDescription = validateShortDescription(
      data.shortDescription
    );
  }

  if (data.products !== undefined) {
    validated.products = validateProducts(data.products);
  }

  if (data.type !== undefined) {
    validated.type = validateType(data.type);
  }

  if (data.isActive !== undefined) {
    if (typeof data.isActive !== "boolean") {
      throw new ValidationError("isActive phải là true hoặc false");
    }
    validated.isActive = data.isActive;
  }

  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      throw new ValidationError("Tags phải là một mảng");
    }
    validated.tags = data.tags
      .filter((tag) => typeof tag === "string" && tag.trim().length > 0)
      .map((tag) => tag.trim())
      .slice(0, 20);
  }

  if (data.updatedBy !== undefined) {
    validated.updatedBy = data.updatedBy;
  }

  return validated;
};

// Validate add product to group data
const validateAddProductData = (data) => {
  if (!data.productId) {
    throw new ValidationError("ID sản phẩm là bắt buộc");
  }

  const validated = {
    productId: data.productId,
    quantity: data.quantity ? parseInt(data.quantity) : 1,
  };

  if (validated.quantity < 1) {
    validated.quantity = 1;
  }

  if (validated.quantity > 100) {
    throw new ValidationError("Số lượng không được vượt quá 100");
  }

  // categoryLevel0Id is optional - will be auto-filled from product if not provided
  if (data.categoryLevel0Id) {
    validated.categoryLevel0Id = data.categoryLevel0Id;
  }

  return validated;
};

// Validate update product quantity data
const validateUpdateProductQuantityData = (data) => {
  if (!data.productId) {
    throw new ValidationError("ID sản phẩm là bắt buộc");
  }

  const quantity = data.quantity ? parseInt(data.quantity) : 1;

  if (quantity < 0) {
    throw new ValidationError("Số lượng không được nhỏ hơn 0");
  }

  if (quantity > 100) {
    throw new ValidationError("Số lượng không được vượt quá 100");
  }

  return {
    productId: data.productId,
    quantity,
  };
};

module.exports = {
  validateName,
  validateDescription,
  validateShortDescription,
  validateType,
  validateProductItem,
  validateProducts,
  validatePaginationParams,
  validateCreateProductGroupData,
  validateUpdateProductGroupData,
  validateAddProductData,
  validateUpdateProductQuantityData,
};
