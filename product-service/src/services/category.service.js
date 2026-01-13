const categoryRepository = require('../repositories/category.repository');
const categoryValidator = require('../validators/category.validator');
const { 
  CategoryNotFoundError,
  SlugExistsError,
  ValidationError
} = require('../errors');

// Get all categories with pagination and filters
const getAllCategories = async (queryParams = {}) => {
  // Check if pagination is requested
  if (queryParams.page || queryParams.limit) {
    return await getAllCategoriesWithPagination(queryParams);
  }
  
  // Original behavior for backward compatibility
  const filter = categoryValidator.validateSearchParams(queryParams);
  
  return await categoryRepository.find(filter, {
    sort: { sortOrder: 1, name: 1 }
  });
};

// Get all categories with pagination and filters
const getAllCategoriesWithPagination = async (queryParams) => {
  const { page, limit } = categoryValidator.validatePaginationParams(queryParams);
  const filter = categoryValidator.validateSearchParams(queryParams);
  
  // Build sort options
  const { sortBy = 'sortOrder', sortOrder = 'asc' } = queryParams;
  const sort = {};
  
  // Handle special sort cases
  if (sortBy === 'name') {
    sort.name = sortOrder === 'desc' ? -1 : 1;
  } else if (sortBy === 'createdAt') {
    sort.createdAt = sortOrder === 'desc' ? -1 : 1;
  } else if (sortBy === 'updatedAt') {
    sort.updatedAt = sortOrder === 'desc' ? -1 : 1;
  } else {
    // Default sort by sortOrder, then name
    sort.sortOrder = sortOrder === 'desc' ? -1 : 1;
    sort.name = 1;
  }
  
  return await categoryRepository.findWithPagination(filter, page, limit, {
    sort
  });
};

// Get category hierarchy (parent-child tree structure)
const getCategoryHierarchy = async () => {
  return await categoryRepository.getCategoryHierarchy();
};

// Get categories with product count
const getCategoriesWithProductCount = async (onlyWithProducts = false) => {
  if (onlyWithProducts) {
    return await categoryRepository.findWithActiveProducts();
  }
  return await categoryRepository.findWithProductCount();
};

// Get category by ID
const getCategoryById = async (categoryId) => {
  if (!categoryId) {
    throw new ValidationError('ID danh mục là bắt buộc');
  }
  
  const category = await categoryRepository.findById(categoryId);
  if (!category) {
    throw new CategoryNotFoundError('Không tìm thấy danh mục');
  }
  
  return category;
};

// Get category by slug
const getCategoryBySlug = async (slug) => {
  if (!slug) {
    throw new ValidationError('Slug danh mục là bắt buộc');
  }
  
  const category = await categoryRepository.findBySlug(slug);
  if (!category) {
    throw new CategoryNotFoundError('Không tìm thấy danh mục');
  }
  
  return category;
};

// Get root categories (level 0)
const getRootCategories = async () => {
  return await categoryRepository.findRootCategories();
};

// Get child categories by parent ID
const getChildCategories = async (parentId) => {
  if (!parentId) {
    throw new ValidationError('ID danh mục cha là bắt buộc');
  }
  
  // Verify parent exists
  const parent = await categoryRepository.findById(parentId);
  if (!parent) {
    throw new CategoryNotFoundError('Không tìm thấy danh mục cha');
  }
  
  return await categoryRepository.findByParentId(parentId);
};

// Get categories by component type
const getCategoriesByComponentType = async (componentType) => {
  if (!componentType) {
    throw new ValidationError('Loại linh kiện là bắt buộc');
  }
  
  return await categoryRepository.findByComponentType(componentType);
};

// Get category path (breadcrumb)
const getCategoryPath = async (categoryId) => {
  if (!categoryId) {
    throw new ValidationError('ID danh mục là bắt buộc');
  }
  
  return await categoryRepository.getCategoryPath(categoryId);
};

// Create new category
const createCategory = async (categoryData) => {
  const validatedData = categoryValidator.validateCreateCategoryData(categoryData);
  
  // Check slug uniqueness
  const existingSlug = await categoryRepository.slugExists(validatedData.slug);
  if (existingSlug) {
    throw new SlugExistsError(`Slug "${validatedData.slug}" đã tồn tại`);
  }
  
  // Validate parent category if provided
  if (validatedData.parentId) {
    const parentCategory = await categoryRepository.findById(validatedData.parentId);
    if (!parentCategory) {
      throw new CategoryNotFoundError('Không tìm thấy danh mục cha');
    }
    
    // Update level based on parent
    validatedData.level = parentCategory.level + 1;
    
    // Prevent too deep nesting (max 3 levels: 0, 1, 2)
    if (validatedData.level > 2) {
      throw new ValidationError('Không thể tạo danh mục quá 3 cấp');
    }
    
    // Inherit componentType from parent if not provided
    if (!validatedData.componentType && parentCategory.componentType) {
      validatedData.componentType = parentCategory.componentType;
    }
  }
  
  return await categoryRepository.create(validatedData);
};

// Update category
const updateCategory = async (categoryId, updateData) => {
  if (!categoryId) {
    throw new ValidationError('ID danh mục là bắt buộc');
  }
  
  const validatedData = categoryValidator.validateUpdateCategoryData(updateData);
  
  // Check if category exists
  const existingCategory = await categoryRepository.findById(categoryId);
  if (!existingCategory) {
    throw new CategoryNotFoundError('Không tìm thấy danh mục');
  }
  
  // Check slug uniqueness if updating slug
  if (validatedData.slug && validatedData.slug !== existingCategory.slug) {
    const existingSlug = await categoryRepository.slugExists(validatedData.slug, categoryId);
    if (existingSlug) {
      throw new SlugExistsError(`Slug "${validatedData.slug}" đã tồn tại`);
    }
  }
  
  // Validate parent category if updating parent
  if (validatedData.parentId !== undefined) {
    if (validatedData.parentId) {
      // Check if parent exists
      const parentCategory = await categoryRepository.findById(validatedData.parentId);
      if (!parentCategory) {
        throw new CategoryNotFoundError('Không tìm thấy danh mục cha');
      }
      
      // Prevent circular reference
      if (validatedData.parentId === categoryId) {
        throw new ValidationError('Danh mục không thể là cha của chính nó');
      }
      
      // Check if trying to set a child as parent (would create circular reference)
      const categoryPath = await categoryRepository.getCategoryPath(validatedData.parentId);
      const hasCircularRef = categoryPath.some(cat => cat._id.toString() === categoryId);
      if (hasCircularRef) {
        throw new ValidationError('Không thể tạo tham chiếu vòng lặp');
      }
      
      // Update level based on new parent
      validatedData.level = parentCategory.level + 1;
      
      if (validatedData.level > 2) {
        throw new ValidationError('Không thể tạo danh mục quá 3 cấp');
      }
      
      // Inherit componentType from parent if not explicitly provided
      if (validatedData.componentType === undefined && parentCategory.componentType) {
        validatedData.componentType = parentCategory.componentType;
      }
    } else {
      // Setting parent to null (making it root category)
      validatedData.level = 0;
    }
  }
  
  return await categoryRepository.updateById(categoryId, validatedData);
};

// Update category sort order
const updateCategorySortOrder = async (categoryId, sortOrder) => {
  if (!categoryId) {
    throw new ValidationError('ID danh mục là bắt buộc');
  }
  
  if (typeof sortOrder !== 'number') {
    throw new ValidationError('Thứ tự sắp xếp phải là số');
  }
  
  const category = await categoryRepository.findById(categoryId);
  if (!category) {
    throw new CategoryNotFoundError('Không tìm thấy danh mục');
  }
  
  return await categoryRepository.updateSortOrder(categoryId, Math.floor(sortOrder));
};

// Delete category
const deleteCategory = async (categoryId) => {
  if (!categoryId) {
    throw new ValidationError('ID danh mục là bắt buộc');
  }
  
  const category = await categoryRepository.findById(categoryId);
  if (!category) {
    throw new CategoryNotFoundError('Không tìm thấy danh mục');
  }
  
  // Check if category has children
  const children = await categoryRepository.findByParentId(categoryId);
  if (children.length > 0) {
    throw new ValidationError('Không thể xóa danh mục có danh mục con. Vui lòng xóa danh mục con trước.');
  }
  
  // Check if category has products
  // This would require checking with product repository, but for now we'll allow deletion
  // In production, you might want to either:
  // 1. Prevent deletion if has products
  // 2. Move products to another category
  // 3. Mark products as inactive
  
  await categoryRepository.deleteById(categoryId);
  
  return { message: 'Xóa danh mục thành công' };
};

// Search categories
const searchCategories = async (searchTerm, options = {}) => {
  if (!searchTerm || typeof searchTerm !== 'string') {
    throw new ValidationError('Từ khóa tìm kiếm là bắt buộc');
  }
  
  const trimmedSearch = searchTerm.trim();
  if (trimmedSearch.length < 2) {
    throw new ValidationError('Từ khóa tìm kiếm phải có ít nhất 2 ký tự');
  }
  
  return await categoryRepository.searchByName(trimmedSearch, options);
};

// Toggle category status
const toggleCategoryStatus = async (categoryId) => {
  if (!categoryId) {
    throw new ValidationError('ID danh mục là bắt buộc');
  }
  
  const category = await categoryRepository.findById(categoryId);
  if (!category) {
    throw new CategoryNotFoundError('Không tìm thấy danh mục');
  }
  
  // If deactivating, also deactivate all children
  if (category.isActive) {
    const children = await categoryRepository.findByParentId(categoryId);
    if (children.length > 0) {
      await categoryRepository.updateMany(
        { parentId: categoryId },
        { isActive: false }
      );
    }
  }
  
  return await categoryRepository.updateById(categoryId, {
    isActive: !category.isActive
  });
};

// Get category statistics
const getCategoryStats = async (categoryId) => {
  if (!categoryId) {
    throw new ValidationError('ID danh mục là bắt buộc');
  }
  
  const category = await categoryRepository.findById(categoryId);
  if (!category) {
    throw new CategoryNotFoundError('Không tìm thấy danh mục');
  }
  
  // This would require aggregation with products collection
  // For now, return basic info
  const children = await categoryRepository.findByParentId(categoryId);
  
  return {
    category: category,
    childrenCount: children.length,
    // In a full implementation, you'd add:
    // productCount, totalSales, averagePrice, etc.
  };
};

module.exports = {
  getAllCategories,
  getAllCategoriesWithPagination,
  getCategoryHierarchy,
  getCategoriesWithProductCount,
  getCategoryById,
  getCategoryBySlug,
  getRootCategories,
  getChildCategories,
  getCategoriesByComponentType,
  getCategoryPath,
  createCategory,
  updateCategory,
  updateCategorySortOrder,
  deleteCategory,
  searchCategories,
  toggleCategoryStatus,
  getCategoryStats
};
