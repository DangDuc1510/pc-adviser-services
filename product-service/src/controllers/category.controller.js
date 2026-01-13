const categoryService = require('../services/category.service');
const cloudinaryUtils = require('../utils/cloudinary');
const Category = require('../models/category.model');

// Get all categories
const getAll = async (req, res, next) => {
  try {
    const categories = await categoryService.getAllCategories(req.query);
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

// Get category hierarchy
const getHierarchy = async (req, res, next) => {
  try {
    const hierarchy = await categoryService.getCategoryHierarchy();
    res.json(hierarchy);
  } catch (error) {
    next(error);
  }
};

// Get categories with product count
const getWithProductCount = async (req, res, next) => {
  try {
    const { onlyWithProducts = false } = req.query;
    const categories = await categoryService.getCategoriesWithProductCount(onlyWithProducts === 'true');
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

// Get category by ID
const getById = async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    res.json(category);
  } catch (error) {
    next(error);
  }
};

// Get category by slug
const getBySlug = async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryBySlug(req.params.slug);
    res.json(category);
  } catch (error) {
    next(error);
  }
};

// Get root categories
const getRootCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getRootCategories();
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

// Get child categories
const getChildCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getChildCategories(req.params.parentId);
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

// Get categories by component type
const getByComponentType = async (req, res, next) => {
  try {
    const categories = await categoryService.getCategoriesByComponentType(req.params.componentType);
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

// Get category path (breadcrumb)
const getCategoryPath = async (req, res, next) => {
  try {
    const path = await categoryService.getCategoryPath(req.params.id);
    res.json(path);
  } catch (error) {
    next(error);
  }
};

// Create category
const create = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

// Update category
const update = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    res.json(category);
  } catch (error) {
    next(error);
  }
};

// Update category sort order
const updateSortOrder = async (req, res, next) => {
  try {
    const { sortOrder } = req.body;
    const category = await categoryService.updateCategorySortOrder(req.params.id, sortOrder);
    res.json(category);
  } catch (error) {
    next(error);
  }
};

// Delete category
const deleteCategory = async (req, res, next) => {
  try {
    const result = await categoryService.deleteCategory(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Search categories
const search = async (req, res, next) => {
  try {
    const { q, limit } = req.query;
    const categories = await categoryService.searchCategories(q, { limit });
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

// Toggle category status
const toggleStatus = async (req, res, next) => {
  try {
    const category = await categoryService.toggleCategoryStatus(req.params.id);
    res.json(category);
  } catch (error) {
    next(error);
  }
};

// Get category statistics
const getStats = async (req, res, next) => {
  try {
    const stats = await categoryService.getCategoryStats(req.params.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

// Upload category image
const uploadImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Không có file ảnh được tải lên'
      });
    }

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy category'
      });
    }

    // Delete old image if exists
    if (category.imageUrl) {
      try {
        const urlParts = category.imageUrl.split('/');
        const publicIdWithExtension = urlParts.slice(-2).join('/');
        const publicId = publicIdWithExtension.split('.')[0];
        await cloudinaryUtils.deleteImage(publicId);
      } catch (error) {
        console.error('Error deleting old image:', error);
      }
    }

    // Upload new image to Cloudinary
    const uploadResult = await cloudinaryUtils.uploadCategoryImage(req.file.buffer, id);

    // Update category image in database
    category.imageUrl = uploadResult.url;
    await category.save();

    res.json({
      status: 'success',
      message: 'Upload ảnh category thành công',
      data: {
        image: uploadResult,
        category: category
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete category image
const deleteImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy category'
      });
    }

    if (!category.imageUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'Category chưa có ảnh'
      });
    }

    // Extract public ID from Cloudinary URL
    const urlParts = category.imageUrl.split('/');
    const publicIdWithExtension = urlParts.slice(-2).join('/');
    const publicId = publicIdWithExtension.split('.')[0];

    try {
      // Delete from Cloudinary
      await cloudinaryUtils.deleteImage(publicId);
    } catch (error) {
      console.error('Cloudinary delete error:', error);
    }

    // Remove image from database
    category.imageUrl = null;
    await category.save();

    res.json({
      status: 'success',
      message: 'Xóa ảnh category thành công',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getHierarchy,
  getWithProductCount,
  getById,
  getBySlug,
  getRootCategories,
  getChildCategories,
  getByComponentType,
  getCategoryPath,
  create,
  update,
  updateSortOrder,
  delete: deleteCategory,
  search,
  toggleStatus,
  getStats,
  uploadImage,
  deleteImage
};