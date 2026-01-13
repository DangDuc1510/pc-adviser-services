const brandService = require('../services/brand.service');
const cloudinaryUtils = require('../utils/cloudinary');
const Brand = require('../models/brand.model');

// Get all brands
const getAll = async (req, res, next) => {
  try {
    const brands = await brandService.getAllBrands(req.query);
    res.json(brands);
  } catch (error) {
    next(error);
  }
};

// Get brands with product count
const getWithProductCount = async (req, res, next) => {
  try {
    const { onlyWithProducts = false } = req.query;
    const brands = await brandService.getBrandsWithProductCount(onlyWithProducts === 'true');
    res.json(brands);
  } catch (error) {
    next(error);
  }
};

// Get popular brands
const getPopularBrands = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const brands = await brandService.getPopularBrands(parseInt(limit));
    res.json(brands);
  } catch (error) {
    next(error);
  }
};

// Get brand by ID
const getById = async (req, res, next) => {
  try {
    const brand = await brandService.getBrandById(req.params.id);
    res.json(brand);
  } catch (error) {
    next(error);
  }
};

// Get brand by slug
const getBySlug = async (req, res, next) => {
  try {
    const brand = await brandService.getBrandBySlug(req.params.slug);
    res.json(brand);
  } catch (error) {
    next(error);
  }
};

// Get brands by country
const getByCountry = async (req, res, next) => {
  try {
    const { country } = req.params;
    const { limit } = req.query;
    const brands = await brandService.getBrandsByCountry(country, { limit });
    res.json(brands);
  } catch (error) {
    next(error);
  }
};

// Get brands by category
const getByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { limit } = req.query;
    const brands = await brandService.getBrandsByCategory(categoryId, { limit });
    res.json(brands);
  } catch (error) {
    next(error);
  }
};

// Get brand statistics
const getStats = async (req, res, next) => {
  try {
    const stats = await brandService.getBrandStats(req.params.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

// Create brand
const create = async (req, res, next) => {
  try {
    const brand = await brandService.createBrand(req.body);
    res.status(201).json(brand);
  } catch (error) {
    next(error);
  }
};

// Update brand
const update = async (req, res, next) => {
  try {
    const brand = await brandService.updateBrand(req.params.id, req.body);
    res.json(brand);
  } catch (error) {
    next(error);
  }
};

// Delete brand
const deleteBrand = async (req, res, next) => {
  try {
    const result = await brandService.deleteBrand(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Search brands
const search = async (req, res, next) => {
  try {
    const { q, limit } = req.query;
    const brands = await brandService.searchBrands(q, { limit });
    res.json(brands);
  } catch (error) {
    next(error);
  }
};

// Toggle brand status
const toggleStatus = async (req, res, next) => {
  try {
    const brand = await brandService.toggleBrandStatus(req.params.id);
    res.json(brand);
  } catch (error) {
    next(error);
  }
};

// Get active brands
const getActiveBrands = async (req, res, next) => {
  try {
    const brands = await brandService.getActiveBrands();
    res.json(brands);
  } catch (error) {
    next(error);
  }
};

// Get brands grouped by country
const getBrandsGroupedByCountry = async (req, res, next) => {
  try {
    const brands = await brandService.getBrandsGroupedByCountry();
    res.json(brands);
  } catch (error) {
    next(error);
  }
};

// Bulk update brand status
const bulkUpdateStatus = async (req, res, next) => {
  try {
    const { brandIds, isActive } = req.body;
    const result = await brandService.bulkUpdateBrandStatus(brandIds, isActive);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Upload brand logo
const uploadLogo = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Không có file logo được tải lên'
      });
    }

    // Check if brand exists
    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy brand'
      });
    }

    // Delete old logo if exists
    if (brand.logoUrl) {
      try {
        const urlParts = brand.logoUrl.split('/');
        const publicIdWithExtension = urlParts.slice(-2).join('/');
        const publicId = publicIdWithExtension.split('.')[0];
        await cloudinaryUtils.deleteImage(publicId);
      } catch (error) {
        console.error('Error deleting old logo:', error);
      }
    }

    // Upload new logo to Cloudinary
    const uploadResult = await cloudinaryUtils.uploadBrandLogo(req.file.buffer, id);

    // Update brand logo in database
    brand.logoUrl = uploadResult.url;
    await brand.save();

    res.json({
      status: 'success',
      message: 'Upload logo thành công',
      data: {
        logo: uploadResult,
        brand: brand
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete brand logo
const deleteLogo = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy brand'
      });
    }

    if (!brand.logoUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'Brand chưa có logo'
      });
    }

    // Extract public ID from Cloudinary URL
    const urlParts = brand.logoUrl.split('/');
    const publicIdWithExtension = urlParts.slice(-2).join('/');
    const publicId = publicIdWithExtension.split('.')[0];

    try {
      // Delete from Cloudinary
      await cloudinaryUtils.deleteImage(publicId);
    } catch (error) {
      console.error('Cloudinary delete error:', error);
    }

    // Remove logo from database
    brand.logoUrl = null;
    await brand.save();

    res.json({
      status: 'success',
      message: 'Xóa logo thành công',
      data: brand
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getWithProductCount,
  getPopularBrands,
  getById,
  getBySlug,
  getByCountry,
  getByCategory,
  getStats,
  create,
  update,
  delete: deleteBrand,
  search,
  toggleStatus,
  getActiveBrands,
  getBrandsGroupedByCountry,
  bulkUpdateStatus,
  uploadLogo,
  deleteLogo
};