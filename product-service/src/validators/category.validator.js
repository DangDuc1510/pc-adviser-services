const { ValidationError } = require('../errors');
const { PRODUCT_TYPES } = require('../constants');

// Generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove Vietnamese diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim('-'); // Remove leading/trailing hyphens
};

// Validate category name
const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    throw new ValidationError('Tên danh mục là bắt buộc');
  }
  
  const trimmedName = name.trim();
  if (trimmedName.length < 2) {
    throw new ValidationError('Tên danh mục phải có ít nhất 2 ký tự');
  }
  
  if (trimmedName.length > 100) {
    throw new ValidationError('Tên danh mục không được vượt quá 100 ký tự');
  }
  
  return trimmedName;
};

// Validate slug
const validateSlug = (slug, name) => {
  if (slug && typeof slug === 'string') {
    const trimmedSlug = slug.trim();
    if (trimmedSlug.length > 0) {
      return generateSlug(trimmedSlug);
    }
  }
  
  return generateSlug(name);
};

// Validate description
const validateDescription = (description) => {
  if (!description) {
    return undefined;
  }
  
  if (typeof description !== 'string') {
    throw new ValidationError('Mô tả danh mục phải là chuỗi văn bản');
  }
  
  const trimmedDescription = description.trim();
  if (trimmedDescription.length > 1000) {
    throw new ValidationError('Mô tả danh mục không được vượt quá 1000 ký tự');
  }
  
  return trimmedDescription;
};

// Validate component type
const validateComponentType = (componentType) => {
  if (!componentType) {
    return undefined;
  }
  
  const validTypes = Object.values(PRODUCT_TYPES);
  if (!validTypes.includes(componentType)) {
    throw new ValidationError(`Loại linh kiện phải là một trong: ${validTypes.join(', ')}`);
  }
  
  return componentType;
};

// Validate parent ID
const validateParentId = (parentId) => {
  if (!parentId) {
    return null;
  }
  
  if (typeof parentId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(parentId)) {
    throw new ValidationError('ID danh mục cha không hợp lệ');
  }
  
  return parentId;
};

// Validate level
const validateLevel = (level, parentId) => {
  if (level !== undefined) {
    if (typeof level !== 'number' || level < 0 || level > 3) {
      throw new ValidationError('Cấp độ danh mục phải từ 0 đến 3');
    }
    return level;
  }
  
  // Auto determine level based on parent
  if (parentId) {
    return 1; // Will be updated based on parent's level + 1
  }
  
  return 0; // Root category
};

// Validate sort order
const validateSortOrder = (sortOrder) => {
  if (sortOrder === undefined || sortOrder === null) {
    return 0;
  }
  
  if (typeof sortOrder !== 'number') {
    throw new ValidationError('Thứ tự sắp xếp phải là số');
  }
  
  return Math.floor(sortOrder);
};

// Validate SEO meta fields
const validateMetaTitle = (metaTitle, name) => {
  if (!metaTitle) {
    return name;
  }
  
  if (typeof metaTitle !== 'string') {
    throw new ValidationError('Meta title phải là chuỗi');
  }
  
  const trimmed = metaTitle.trim();
  if (trimmed.length > 60) {
    throw new ValidationError('Meta title không được vượt quá 60 ký tự');
  }
  
  return trimmed;
};

const validateMetaDescription = (metaDescription) => {
  if (!metaDescription) {
    return undefined;
  }
  
  if (typeof metaDescription !== 'string') {
    throw new ValidationError('Meta description phải là chuỗi');
  }
  
  const trimmed = metaDescription.trim();
  if (trimmed.length > 160) {
    throw new ValidationError('Meta description không được vượt quá 160 ký tự');
  }
  
  return trimmed;
};

const validateMetaKeywords = (metaKeywords) => {
  if (!metaKeywords) {
    return undefined;
  }
  
  if (!Array.isArray(metaKeywords)) {
    throw new ValidationError('Meta keywords phải là một mảng');
  }
  
  const validKeywords = metaKeywords
    .filter(keyword => keyword && typeof keyword === 'string')
    .map(keyword => keyword.trim())
    .filter(keyword => keyword.length > 0);
  
  return validKeywords.length > 0 ? validKeywords : undefined;
};

// Validate create category data
const validateCreateCategoryData = (data) => {
  const validatedData = {
    name: validateName(data.name),
    description: validateDescription(data.description),
    componentType: validateComponentType(data.componentType),
    parentId: validateParentId(data.parentId),
    level: validateLevel(data.level, data.parentId),
    sortOrder: validateSortOrder(data.sortOrder),
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    metaTitle: validateMetaTitle(data.metaTitle, validateName(data.name)),
    metaDescription: validateMetaDescription(data.metaDescription),
    metaKeywords: validateMetaKeywords(data.metaKeywords)
  };
  
  // Generate slug
  validatedData.slug = validateSlug(data.slug, validatedData.name);
  
  return validatedData;
};

// Validate update category data
const validateUpdateCategoryData = (data) => {
  const validatedData = {};
  
  if (data.name !== undefined) {
    validatedData.name = validateName(data.name);
    // Update slug if name changes
    validatedData.slug = validateSlug(data.slug, validatedData.name);
    // Update meta title if not explicitly provided
    if (!data.metaTitle) {
      validatedData.metaTitle = validateMetaTitle(data.metaTitle, validatedData.name);
    }
  }
  
  if (data.slug !== undefined && !validatedData.slug) {
    validatedData.slug = validateSlug(data.slug, data.name || 'category');
  }
  
  if (data.description !== undefined) {
    validatedData.description = validateDescription(data.description);
  }
  
  if (data.componentType !== undefined) {
    validatedData.componentType = validateComponentType(data.componentType);
  }
  
  if (data.parentId !== undefined) {
    validatedData.parentId = validateParentId(data.parentId);
    validatedData.level = validateLevel(data.level, validatedData.parentId);
  }
  
  if (data.level !== undefined && validatedData.level === undefined) {
    validatedData.level = validateLevel(data.level, data.parentId);
  }
  
  if (data.sortOrder !== undefined) {
    validatedData.sortOrder = validateSortOrder(data.sortOrder);
  }
  
  if (data.isActive !== undefined) {
    validatedData.isActive = Boolean(data.isActive);
  }
  
  if (data.metaTitle !== undefined) {
    validatedData.metaTitle = validateMetaTitle(data.metaTitle, data.name);
  }
  
  if (data.metaDescription !== undefined) {
    validatedData.metaDescription = validateMetaDescription(data.metaDescription);
  }
  
  if (data.metaKeywords !== undefined) {
    validatedData.metaKeywords = validateMetaKeywords(data.metaKeywords);
  }
  
  return validatedData;
};

// Validate pagination parameters
const validatePaginationParams = (query) => {
  const { page = 1, limit = 20 } = query;
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  
  if (isNaN(pageNum) || pageNum < 1) {
    throw new ValidationError('Trang phải là số nguyên dương');
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
    throw new ValidationError('Giới hạn phải từ 1 đến 1000');
  }
  
  return {
    page: pageNum,
    limit: limitNum
  };
};

// Validate search parameters
const validateSearchParams = (query) => {
  const { search, componentType, level, isActive, parentId } = query;
  const filter = {};
  
  if (search && typeof search === 'string') {
    const searchTerm = search.trim();
    if (searchTerm.length > 0) {
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ];
    }
  }
  
  if (componentType && Object.values(PRODUCT_TYPES).includes(componentType)) {
    filter.componentType = componentType;
  }
  
  if (level !== undefined) {
    const levelNum = parseInt(level);
    if (!isNaN(levelNum) && levelNum >= 0 && levelNum <= 3) {
      filter.level = levelNum;
    }
  }
  
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }
  
  if (parentId) {
    if (parentId === 'null' || parentId === 'root') {
      filter.parentId = null;
    } else if (/^[0-9a-fA-F]{24}$/.test(parentId)) {
      filter.parentId = parentId;
    }
  }
  
  return filter;
};

module.exports = {
  validateName,
  validateSlug,
  validateDescription,
  validateComponentType,
  validateParentId,
  validateLevel,
  validateSortOrder,
  validateMetaTitle,
  validateMetaDescription,
  validateMetaKeywords,
  validateCreateCategoryData,
  validateUpdateCategoryData,
  validatePaginationParams,
  validateSearchParams,
  generateSlug
};
