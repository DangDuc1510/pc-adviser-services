const brandRepository = require('../repositories/brand.repository');
const brandValidator = require('../validators/brand.validator');
const { 
  BrandNotFoundError,
  SlugExistsError,
  ValidationError
} = require('../errors');

// Get all brands with pagination and filters
const getAllBrands = async (queryParams = {}) => {
  // Check if pagination is requested
  if (queryParams.page || queryParams.limit) {
    return await getAllBrandsWithPagination(queryParams);
  }
  
  // Original behavior for backward compatibility
  const filter = brandValidator.validateSearchParams(queryParams);
  
  return await brandRepository.find(filter, {
    sort: { name: 1 }
  });
};

// Get all brands with pagination and filters
const getAllBrandsWithPagination = async (queryParams) => {
  const { page, limit } = brandValidator.validatePaginationParams(queryParams);
  const filter = brandValidator.validateSearchParams(queryParams);
  
  // Build sort options
  const { sortBy = 'name', sortOrder = 'asc' } = queryParams;
  const sort = {};
  
  // Handle special sort cases
  if (sortBy === 'name') {
    sort.name = sortOrder === 'desc' ? -1 : 1;
  } else if (sortBy === 'country') {
    sort.country = sortOrder === 'desc' ? -1 : 1;
    sort.name = 1; // Secondary sort by name
  } else if (sortBy === 'createdAt') {
    sort.createdAt = sortOrder === 'desc' ? -1 : 1;
  } else if (sortBy === 'updatedAt') {
    sort.updatedAt = sortOrder === 'desc' ? -1 : 1;
  } else {
    // Default sort by name
    sort.name = sortOrder === 'desc' ? -1 : 1;
  }
  
  return await brandRepository.findWithPagination(filter, page, limit, {
    sort
  });
};

// Get brands with product count
const getBrandsWithProductCount = async (onlyWithProducts = false) => {
  if (onlyWithProducts) {
    return await brandRepository.findWithActiveProducts();
  }
  return await brandRepository.findWithProductCount();
};

// Get popular brands (brands with most products)
const getPopularBrands = async (limit = 10) => {
  return await brandRepository.findPopularBrands(limit);
};

// Get brand by ID
const getBrandById = async (brandId) => {
  if (!brandId) {
    throw new ValidationError('ID thương hiệu là bắt buộc');
  }
  
  const brand = await brandRepository.findById(brandId);
  if (!brand) {
    throw new BrandNotFoundError('Không tìm thấy thương hiệu');
  }
  
  return brand;
};

// Get brand by slug
const getBrandBySlug = async (slug) => {
  if (!slug) {
    throw new ValidationError('Slug thương hiệu là bắt buộc');
  }
  
  const brand = await brandRepository.findBySlug(slug);
  if (!brand) {
    throw new BrandNotFoundError('Không tìm thấy thương hiệu');
  }
  
  return brand;
};

// Get brands by country
const getBrandsByCountry = async (country, options = {}) => {
  if (!country) {
    throw new ValidationError('Quốc gia là bắt buộc');
  }
  
  return await brandRepository.findByCountry(country, options);
};

// Get brands by category (brands that have products in specific category)
const getBrandsByCategory = async (categoryId, options = {}) => {
  if (!categoryId) {
    throw new ValidationError('ID danh mục là bắt buộc');
  }
  
  return await brandRepository.findByCategory(categoryId, options);
};

// Get brand statistics
const getBrandStats = async (brandId) => {
  if (!brandId) {
    throw new ValidationError('ID thương hiệu là bắt buộc');
  }
  
  const brand = await brandRepository.findById(brandId);
  if (!brand) {
    throw new BrandNotFoundError('Không tìm thấy thương hiệu');
  }
  
  return await brandRepository.getBrandStats(brandId);
};

// Create new brand
const createBrand = async (brandData) => {
  const validatedData = brandValidator.validateCreateBrandData(brandData);
  
  // Check slug uniqueness
  const existingSlug = await brandRepository.slugExists(validatedData.slug);
  if (existingSlug) {
    throw new SlugExistsError(`Slug "${validatedData.slug}" đã tồn tại`);
  }
  
  // Check name uniqueness (brands should have unique names)
  const existingName = await brandRepository.findOne({ name: validatedData.name });
  if (existingName) {
    throw new ValidationError(`Thương hiệu "${validatedData.name}" đã tồn tại`);
  }
  
  return await brandRepository.create(validatedData);
};

// Update brand
const updateBrand = async (brandId, updateData) => {
  if (!brandId) {
    throw new ValidationError('ID thương hiệu là bắt buộc');
  }
  
  const validatedData = brandValidator.validateUpdateBrandData(updateData);
  
  // Check if brand exists
  const existingBrand = await brandRepository.findById(brandId);
  if (!existingBrand) {
    throw new BrandNotFoundError('Không tìm thấy thương hiệu');
  }
  
  // Check slug uniqueness if updating slug
  if (validatedData.slug && validatedData.slug !== existingBrand.slug) {
    const existingSlug = await brandRepository.slugExists(validatedData.slug, brandId);
    if (existingSlug) {
      throw new SlugExistsError(`Slug "${validatedData.slug}" đã tồn tại`);
    }
  }
  
  // Check name uniqueness if updating name
  if (validatedData.name && validatedData.name !== existingBrand.name) {
    const existingName = await brandRepository.findOne({ 
      name: validatedData.name,
      _id: { $ne: brandId }
    });
    if (existingName) {
      throw new ValidationError(`Thương hiệu "${validatedData.name}" đã tồn tại`);
    }
  }
  
  return await brandRepository.updateById(brandId, validatedData);
};

// Delete brand
const deleteBrand = async (brandId) => {
  if (!brandId) {
    throw new ValidationError('ID thương hiệu là bắt buộc');
  }
  
  const brand = await brandRepository.findById(brandId);
  if (!brand) {
    throw new BrandNotFoundError('Không tìm thấy thương hiệu');
  }
  
  // Check if brand has products
  // This would require checking with product repository
  // For now, we'll allow deletion, but in production you might want to:
  // 1. Prevent deletion if has products
  // 2. Move products to another brand
  // 3. Mark products as inactive
  
  // Get brand stats to check if it has products
  const stats = await brandRepository.getBrandStats(brandId);
  if (stats && stats.statistics && stats.statistics.totalProducts > 0) {
    throw new ValidationError('Không thể xóa thương hiệu có sản phẩm. Vui lòng xóa hoặc chuyển sản phẩm sang thương hiệu khác trước.');
  }
  
  await brandRepository.deleteById(brandId);
  
  return { message: 'Xóa thương hiệu thành công' };
};

// Search brands
const searchBrands = async (searchTerm, options = {}) => {
  if (!searchTerm || typeof searchTerm !== 'string') {
    throw new ValidationError('Từ khóa tìm kiếm là bắt buộc');
  }
  
  const trimmedSearch = searchTerm.trim();
  if (trimmedSearch.length < 1) {
    throw new ValidationError('Từ khóa tìm kiếm không được để trống');
  }
  
  return await brandRepository.searchByName(trimmedSearch, options);
};

// Toggle brand status
const toggleBrandStatus = async (brandId) => {
  if (!brandId) {
    throw new ValidationError('ID thương hiệu là bắt buộc');
  }
  
  const brand = await brandRepository.findById(brandId);
  if (!brand) {
    throw new BrandNotFoundError('Không tìm thấy thương hiệu');
  }
  
  return await brandRepository.updateById(brandId, {
    isActive: !brand.isActive
  });
};

// Get active brands for dropdown/selection
const getActiveBrands = async () => {
  return await brandRepository.find({ isActive: true }, {
    select: '_id name slug logo',
    sort: { name: 1 }
  });
};

// Get brands grouped by country
const getBrandsGroupedByCountry = async () => {
  try {
    const pipeline = [
      { $match: { isActive: true } },
      { $group: {
        _id: '$country',
        brands: { $push: {
          _id: '$_id',
          name: '$name',
          slug: '$slug',
          logo: '$logo'
        }},
        count: { $sum: 1 }
      }},
      { $sort: { '_id': 1 } }
    ];
    
    return await brandRepository.aggregate(pipeline);
  } catch (error) {
    throw new ValidationError(`Lỗi khi nhóm thương hiệu theo quốc gia: ${error.message}`);
  }
};

// Bulk update brand status
const bulkUpdateBrandStatus = async (brandIds, isActive) => {
  if (!brandIds || !Array.isArray(brandIds) || brandIds.length === 0) {
    throw new ValidationError('Danh sách ID thương hiệu là bắt buộc');
  }
  
  if (typeof isActive !== 'boolean') {
    throw new ValidationError('Trạng thái phải là true hoặc false');
  }
  
  const result = await brandRepository.updateMany(
    { _id: { $in: brandIds } },
    { isActive }
  );
  
  return {
    message: `Đã cập nhật trạng thái ${result.modifiedCount} thương hiệu`,
    modifiedCount: result.modifiedCount
  };
};

module.exports = {
  getAllBrands,
  getAllBrandsWithPagination,
  getBrandsWithProductCount,
  getPopularBrands,
  getBrandById,
  getBrandBySlug,
  getBrandsByCountry,
  getBrandsByCategory,
  getBrandStats,
  createBrand,
  updateBrand,
  deleteBrand,
  searchBrands,
  toggleBrandStatus,
  getActiveBrands,
  getBrandsGroupedByCountry,
  bulkUpdateBrandStatus
};
