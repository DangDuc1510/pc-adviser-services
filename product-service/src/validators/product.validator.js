const { ValidationError } = require("../errors");
const {
  PRODUCT_STATUS,
  PRODUCT_TYPES,
  VALIDATION,
  CURRENCY,
  VALID_USE_CASES,
  VALID_COLORS,
} = require("../constants");

// Validate product name
const validateName = (name) => {
  if (!name || typeof name !== "string") {
    throw new ValidationError("Tên sản phẩm là bắt buộc");
  }

  const trimmedName = name.trim();
  if (trimmedName.length < VALIDATION.NAME_MIN_LENGTH) {
    throw new ValidationError(
      `Tên sản phẩm phải có ít nhất ${VALIDATION.NAME_MIN_LENGTH} ký tự`
    );
  }

  if (trimmedName.length > VALIDATION.NAME_MAX_LENGTH) {
    throw new ValidationError(
      `Tên sản phẩm không được vượt quá ${VALIDATION.NAME_MAX_LENGTH} ký tự`
    );
  }

  return trimmedName;
};

// Validate SKU
const validateSKU = (sku) => {
  if (!sku || typeof sku !== "string") {
    throw new ValidationError("Mã SKU là bắt buộc");
  }

  const trimmedSKU = sku.trim();
  if (trimmedSKU.length < VALIDATION.SKU_MIN_LENGTH) {
    throw new ValidationError(
      `Mã SKU phải có ít nhất ${VALIDATION.SKU_MIN_LENGTH} ký tự`
    );
  }

  if (trimmedSKU.length > VALIDATION.SKU_MAX_LENGTH) {
    throw new ValidationError(
      `Mã SKU không được vượt quá ${VALIDATION.SKU_MAX_LENGTH} ký tự`
    );
  }

  // SKU should only contain alphanumeric characters, hyphens, and underscores
  const skuRegex = /^[A-Za-z0-9_-]+$/;
  if (!skuRegex.test(trimmedSKU)) {
    throw new ValidationError(
      "Mã SKU chỉ được chứa chữ cái, số, gạch ngang và gạch dưới"
    );
  }

  return trimmedSKU.toUpperCase();
};

// Validate description
const validateDescription = (description, isRequired = false) => {
  if (!description) {
    if (isRequired) {
      throw new ValidationError("Mô tả sản phẩm là bắt buộc");
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

// Validate pricing
const validatePricing = (pricing) => {
  if (!pricing || typeof pricing !== "object") {
    throw new ValidationError("Thông tin giá là bắt buộc");
  }

  const { originalPrice, salePrice, currency, isOnSale } = pricing;

  // Validate original price
  if (originalPrice === undefined || originalPrice === null) {
    throw new ValidationError("Giá gốc là bắt buộc");
  }

  if (
    typeof originalPrice !== "number" ||
    originalPrice < VALIDATION.MIN_PRICE
  ) {
    throw new ValidationError(
      `Giá gốc phải là số lớn hơn ${VALIDATION.MIN_PRICE}`
    );
  }

  if (originalPrice > VALIDATION.MAX_PRICE) {
    throw new ValidationError(
      `Giá gốc không được vượt quá ${VALIDATION.MAX_PRICE}`
    );
  }

  const validatedPricing = {
    originalPrice,
    currency: currency || CURRENCY.VND,
    isOnSale: Boolean(isOnSale),
  };

  // Validate sale price if on sale
  if (isOnSale) {
    if (salePrice === undefined || salePrice === null) {
      throw new ValidationError(
        "Giá khuyến mãi là bắt buộc khi sản phẩm đang giảm giá"
      );
    }

    if (typeof salePrice !== "number" || salePrice < VALIDATION.MIN_PRICE) {
      throw new ValidationError(
        `Giá khuyến mãi phải là số lớn hơn ${VALIDATION.MIN_PRICE}`
      );
    }

    if (salePrice >= originalPrice) {
      throw new ValidationError("Giá khuyến mãi phải nhỏ hơn giá gốc");
    }

    validatedPricing.salePrice = salePrice;

    // Calculate discount percentage
    validatedPricing.discountPercent = Math.round(
      ((originalPrice - salePrice) / originalPrice) * 100
    );
  }

  return validatedPricing;
};

// Validate inventory
const validateInventory = (inventory) => {
  if (!inventory || typeof inventory !== "object") {
    throw new ValidationError("Thông tin kho hàng là bắt buộc");
  }

  const { stock, lowStockThreshold, reservedStock } = inventory;

  if (stock === undefined || stock === null) {
    throw new ValidationError("Số lượng tồn kho là bắt buộc");
  }

  if (
    typeof stock !== "number" ||
    stock < VALIDATION.MIN_STOCK ||
    stock > VALIDATION.MAX_STOCK
  ) {
    throw new ValidationError(
      `Số lượng tồn kho phải từ ${VALIDATION.MIN_STOCK} đến ${VALIDATION.MAX_STOCK}`
    );
  }

  const validatedInventory = {
    stock: Math.floor(stock),
    isInStock: stock > 0,
    lowStockThreshold: lowStockThreshold || 10,
    reservedStock: reservedStock || 0,
  };

  if (validatedInventory.reservedStock > validatedInventory.stock) {
    throw new ValidationError("Số lượng đặt trước không được lớn hơn tồn kho");
  }

  return validatedInventory;
};

// Validate images
const validateImages = (images) => {
  if (!images) {
    return undefined;
  }

  if (!Array.isArray(images)) {
    throw new ValidationError("Danh sách ảnh phải là một mảng");
  }

  if (images.length === 0) {
    return undefined;
  }

  const validatedImages = images.map((image, index) => {
    if (!image || typeof image !== "object") {
      throw new ValidationError(`Ảnh thứ ${index + 1} không hợp lệ`);
    }

    if (!image.url || typeof image.url !== "string") {
      throw new ValidationError(`URL ảnh thứ ${index + 1} là bắt buộc`);
    }

    return {
      url: image.url.trim(),
      alt: image.alt ? image.alt.trim() : "",
      isPrimary: index === 0, // First image is primary
      sortOrder: image.sortOrder || index,
    };
  });

  return validatedImages;
};

// Validate SEO data
const validateSEO = (seo, productName) => {
  if (!seo || typeof seo !== "object") {
    return {
      slug: generateSlug(productName),
      metaTitle: productName,
      metaDescription: `Mua ${productName} chính hãng, giá tốt tại PC Adviser`,
    };
  }

  const validatedSEO = {
    slug: seo.slug ? generateSlug(seo.slug) : generateSlug(productName),
    metaTitle: seo.metaTitle || productName,
    metaDescription:
      seo.metaDescription ||
      `Mua ${productName} chính hãng, giá tốt tại PC Adviser`,
  };

  if (seo.metaKeywords && Array.isArray(seo.metaKeywords)) {
    validatedSEO.metaKeywords = seo.metaKeywords.filter(
      (keyword) =>
        keyword && typeof keyword === "string" && keyword.trim().length > 0
    );
  }

  if (seo.ogImage && typeof seo.ogImage === "string") {
    validatedSEO.ogImage = seo.ogImage.trim();
  }

  return validatedSEO;
};

// Validate product status
const validateStatus = (status) => {
  if (!status) {
    return PRODUCT_STATUS.DRAFT;
  }

  const validStatuses = Object.values(PRODUCT_STATUS);
  if (!validStatuses.includes(status)) {
    throw new ValidationError(
      `Trạng thái phải là một trong: ${validStatuses.join(", ")}`
    );
  }

  return status;
};

// Validate MongoDB ObjectId
const validateObjectId = (id, fieldName = "ID") => {
  if (!id) {
    throw new ValidationError(`${fieldName} là bắt buộc`);
  }

  if (typeof id !== "string" || !/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new ValidationError(`${fieldName} không hợp lệ`);
  }

  return id;
};

// Validate colors array
const validateColors = (colors) => {
  if (!colors) {
    return [];
  }

  if (!Array.isArray(colors)) {
    throw new ValidationError("Màu sắc phải là một mảng");
  }

  // Filter and validate each color
  const validatedColors = colors
    .filter((color) => color && typeof color === "string")
    .map((color) => color.trim().toLowerCase())
    .filter((color) => VALID_COLORS.includes(color));

  // Check if any invalid colors were provided
  const invalidColors = colors
    .filter((color) => color && typeof color === "string")
    .map((color) => color.trim().toLowerCase())
    .filter((color) => !VALID_COLORS.includes(color));

  if (invalidColors.length > 0) {
    throw new ValidationError(
      `Màu sắc không hợp lệ: ${invalidColors.join(
        ", "
      )}. Các màu hợp lệ: ${VALID_COLORS.join(", ")}`
    );
  }

  // Remove duplicates
  return [...new Set(validatedColors)];
};

// Generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove Vietnamese diacritics
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim("-"); // Remove leading/trailing hyphens
};

// Validate create product data
const validateCreateProductData = (data) => {
  const validatedData = {
    name: validateName(data.name),
    sku: data.sku ? validateSKU(data.sku) : undefined, // SKU can be auto-generated
    shortDescription: validateShortDescription(data.shortDescription),
    fullDescription: validateDescription(data.fullDescription),
    brandId: validateObjectId(data.brandId, "Thương hiệu"),
    categoryId: validateObjectId(data.categoryId, "Danh mục"),
    pricing: validatePricing(data.pricing),
    inventory: validateInventory(data.inventory),
    images: validateImages(data.images),
    status: validateStatus(data.status),
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    isFeatured:
      data.isFeatured !== undefined ? Boolean(data.isFeatured) : false,
  };

  // Generate SEO data
  validatedData.seo = validateSEO(data.seo, validatedData.name);

  // Validate optional fields
  if (data.barcode && typeof data.barcode === "string") {
    validatedData.barcode = data.barcode.trim();
  }

  if (data.colors !== undefined) {
    validatedData.colors = validateColors(data.colors);
  }

  if (data.specifications && typeof data.specifications === "object") {
    validatedData.specifications = data.specifications;
  }

  if (data.tags && Array.isArray(data.tags)) {
    validatedData.tags = data.tags.filter(
      (tag) =>
        tag &&
        typeof tag === "object" &&
        tag.name &&
        typeof tag.name === "string"
    );
  }

  return validatedData;
};

// Validate update product data
const validateUpdateProductData = (data) => {
  const validatedData = {};

  if (data.name !== undefined) {
    validatedData.name = validateName(data.name);
    // Update SEO slug if name changes
    if (data.seo?.slug) {
      validatedData.seo = { ...data.seo, slug: generateSlug(data.seo.slug) };
    } else {
      validatedData.seo = { slug: generateSlug(data.name) };
    }
  }

  if (data.sku !== undefined) {
    validatedData.sku = validateSKU(data.sku);
  }

  if (data.shortDescription !== undefined) {
    validatedData.shortDescription = validateShortDescription(
      data.shortDescription
    );
  }

  if (data.fullDescription !== undefined) {
    validatedData.fullDescription = validateDescription(data.fullDescription);
  }

  if (data.brandId !== undefined) {
    validatedData.brandId = validateObjectId(data.brandId, "Thương hiệu");
  }

  if (data.categoryId !== undefined) {
    validatedData.categoryId = validateObjectId(data.categoryId, "Danh mục");
  }

  if (data.pricing !== undefined) {
    validatedData.pricing = validatePricing(data.pricing);
  }

  if (data.inventory !== undefined) {
    validatedData.inventory = validateInventory(data.inventory);
  }

  if (data.images !== undefined) {
    validatedData.images = validateImages(data.images);
  }

  if (data.status !== undefined) {
    validatedData.status = validateStatus(data.status);
  }

  if (data.isActive !== undefined) {
    validatedData.isActive = Boolean(data.isActive);
  }

  if (data.isFeatured !== undefined) {
    validatedData.isFeatured = Boolean(data.isFeatured);
  }

  if (data.seo !== undefined && !validatedData.seo) {
    validatedData.seo = validateSEO(data.seo, data.name || "Product");
  }

  // Optional fields
  if (data.barcode !== undefined) {
    validatedData.barcode = data.barcode ? data.barcode.trim() : null;
  }

  if (data.colors !== undefined) {
    validatedData.colors = validateColors(data.colors);
  }

  if (data.specifications !== undefined) {
    validatedData.specifications = data.specifications;
  }

  if (data.tags !== undefined) {
    validatedData.tags = Array.isArray(data.tags)
      ? data.tags.filter((tag) => tag && typeof tag === "object" && tag.name)
      : [];
  }

  return validatedData;
};

// Validate stock update data
const validateStockUpdateData = (data) => {
  const { stock, reservedStock } = data;

  if (stock === undefined || stock === null) {
    throw new ValidationError("Số lượng tồn kho là bắt buộc");
  }

  if (typeof stock !== "number" || stock < 0) {
    throw new ValidationError("Số lượng tồn kho phải là số không âm");
  }

  const validatedData = {
    stock: Math.floor(stock),
  };

  if (reservedStock !== undefined) {
    if (typeof reservedStock !== "number" || reservedStock < 0) {
      throw new ValidationError("Số lượng đặt trước phải là số không âm");
    }

    validatedData.reservedStock = Math.floor(reservedStock);

    if (validatedData.reservedStock > validatedData.stock) {
      throw new ValidationError(
        "Số lượng đặt trước không được lớn hơn tồn kho"
      );
    }
  }

  return validatedData;
};

// Validate pagination parameters
const validatePaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 20, 100); // Max 100 items per page

  if (page < 1) {
    throw new ValidationError("Số trang phải lớn hơn 0");
  }

  if (limit < 1) {
    throw new ValidationError("Số lượng mỗi trang phải lớn hơn 0");
  }

  return { page, limit };
};

// Validate search parameters
const validateSearchParams = (query) => {
  const {
    search,
    categoryId,
    brandId,
    status,
    isActive,
    isFeatured,
    isOnSale,
    minPrice,
    maxPrice,
    colors,
    ids,
    useCases,
    ...restParams
  } = query;
  const filter = {};

  // Filter by multiple IDs (comma-separated or array)
  if (ids) {
    const idArray = Array.isArray(ids)
      ? ids
      : ids.split(",").map((id) => id.trim());
    const validIds = idArray.filter((id) => {
      try {
        validateObjectId(id);
        return true;
      } catch (error) {
        return false;
      }
    });
    if (validIds.length > 0) {
      filter._id = { $in: validIds };
    }
  }

  if (search && typeof search === "string") {
    const searchTerm = search.trim();
    if (searchTerm.length >= 2) {
      filter.$text = { $search: searchTerm };
    }
  }

  if (categoryId) {
    // Support both single ID, comma-separated IDs, or array of IDs
    let categoryIdArray = [];
    let isMultiple = false;

    if (Array.isArray(categoryId)) {
      categoryIdArray = categoryId;
      isMultiple = true;
    } else if (typeof categoryId === "string" && categoryId.includes(",")) {
      // Parse comma-separated string
      categoryIdArray = categoryId
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);
      isMultiple = true;
    } else {
      // Single ID - validate directly
      try {
        validateObjectId(categoryId);
        filter.categoryId = categoryId;
      } catch (error) {
        // Ignore invalid categoryId
      }
    }

    // Process multiple IDs if any
    if (isMultiple && categoryIdArray.length > 0) {
      const validIds = categoryIdArray.filter((id) => {
        try {
          validateObjectId(id);
          return true;
        } catch (error) {
          return false;
        }
      });

      if (validIds.length > 0) {
        filter.categoryId =
          validIds.length === 1 ? validIds[0] : { $in: validIds };
      }
    }
  }

  if (brandId) {
    // Support both single ID and array of IDs
    if (Array.isArray(brandId)) {
      const validIds = brandId.filter((id) => {
        try {
          validateObjectId(id);
          return true;
        } catch (error) {
          return false;
        }
      });
      if (validIds.length > 0) {
        filter.brandId =
          validIds.length === 1 ? validIds[0] : { $in: validIds };
      }
    } else {
      try {
        validateObjectId(brandId);
        filter.brandId = brandId;
      } catch (error) {
        // Ignore invalid brandId
      }
    }
  }

  if (status && Object.values(PRODUCT_STATUS).includes(status)) {
    filter.status = status;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  if (isFeatured !== undefined) {
    filter.isFeatured = isFeatured === "true";
  }

  if (isOnSale !== undefined) {
    filter["pricing.isOnSale"] = isOnSale === "true";
  }

  // Color filter - support single color or comma-separated colors
  if (colors) {
    const colorArray = Array.isArray(colors)
      ? colors
      : colors.split(",").map((c) => c.trim());
    const validColors = [
      "black",
      "white",
      "gray",
      "dark-gray",
      "light-gray",
      "red",
      "blue",
      "green",
      "yellow",
      "orange",
      "pink",
      "purple",
      "cyan",
      "brown",
      "silver",
      "gold",
      "rgb",
      "rgb-blue",
      "rgb-red",
      "rgb-green",
    ];
    const filteredColors = colorArray.filter((c) => validColors.includes(c));
    if (filteredColors.length > 0) {
      filter.colors = { $in: filteredColors };
    }
  }

  // Price range
  if (minPrice || maxPrice) {
    filter["pricing.originalPrice"] = {};
    if (minPrice) {
      const min = parseFloat(minPrice);
      if (!isNaN(min) && min >= 0) {
        filter["pricing.originalPrice"].$gte = min;
      }
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max) && max >= 0) {
        filter["pricing.originalPrice"].$lte = max;
      }
    }
  }

  // Filter by use cases - support single or multiple use cases
  if (useCases) {
    const useCaseArray = Array.isArray(useCases)
      ? useCases
      : useCases.split(",").map((uc) => uc.trim());
    const filteredUseCases = useCaseArray.filter((uc) =>
      VALID_USE_CASES.includes(uc)
    );
    if (filteredUseCases.length > 0) {
      // Filter products that have at least one of the specified use cases
      filter["specifications.useCases"] = { $in: filteredUseCases };
    }
  }

  // Handle sub-filters (specifications filters) - format: specs.fieldName
  Object.keys(restParams).forEach((key) => {
    if (key.startsWith("specs.")) {
      const fieldName = key.replace("specs.", "");
      const fieldPath = `specifications.${fieldName}`;
      const value = restParams[key];

      if (value !== undefined && value !== null && value !== "") {
        // Support comma-separated values or arrays
        const valueArray = Array.isArray(value)
          ? value
          : value
              .split(",")
              .map((v) => v.trim())
              .filter((v) => v);

        if (valueArray.length > 0) {
          // For array fields (like socketCompatibility), use $in
          // For single value fields, use $in for multi-select or exact match for single
          if (valueArray.length === 1) {
            filter[fieldPath] = valueArray[0];
          } else {
            filter[fieldPath] = { $in: valueArray };
          }
        }
      }
    }
  });

  // Filter out out-of-stock products - always enforce this at the end
  // Use $expr to calculate availableStock (stock - reservedStock) > 0
  // This ensures products with stock but no available stock (all reserved) are excluded
  // Add $expr condition directly to filter - MongoDB will combine it with other conditions
  filter.$expr = {
    $gt: [
      {
        $subtract: [
          "$inventory.stock",
          { $ifNull: ["$inventory.reservedStock", 0] },
        ],
      },
      0,
    ],
  };

  return filter;
};

module.exports = {
  validateName,
  validateSKU,
  validateDescription,
  validateShortDescription,
  validatePricing,
  validateInventory,
  validateImages,
  validateSEO,
  validateStatus,
  validateObjectId,
  generateSlug,
  validateCreateProductData,
  validateUpdateProductData,
  validateStockUpdateData,
  validatePaginationParams,
  validateSearchParams,
};
