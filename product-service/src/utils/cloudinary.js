const cloudinary = require('cloudinary').v2;
const config = require('../config/env');

// Configure Cloudinary
if (config.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: config.CLOUDINARY_URL
  });
}

/**
 * Upload product image to Cloudinary
 * @param {Buffer} buffer - Image buffer
 * @param {string} productId - Product ID for folder organization
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result with URL and public_id
 */
const uploadProductImage = async (buffer, productId, options = {}) => {
  try {
    const {
      isPrimary = false,
      alt = '',
      sortOrder = 0
    } = options;

    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${buffer.toString('base64')}`,
      {
        folder: `pc-adviser/products/${productId}`,
        public_id: `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        format: 'jpg',
        transformation: [
          {
            width: 800,
            height: 800,
            crop: 'fit',
            quality: 'auto:good'
          }
        ]
      }
    );

    // Create thumbnail version
    const thumbnailResult = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${buffer.toString('base64')}`,
      {
        folder: `pc-adviser/products/${productId}/thumbnails`,
        public_id: `thumb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        format: 'jpg',
        transformation: [
          {
            width: 300,
            height: 300,
            crop: 'fit',
            quality: 'auto:good'
          }
        ]
      }
    );

    return {
      url: result.secure_url,
      thumbnailUrl: thumbnailResult.secure_url,
      publicId: result.public_id,
      thumbnailPublicId: thumbnailResult.public_id,
      alt,
      isPrimary,
      sortOrder,
      format: result.format,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Upload brand logo to Cloudinary
 * @param {Buffer} buffer - Image buffer
 * @param {string} brandId - Brand ID for folder organization
 * @returns {Promise<Object>} Upload result with URL and public_id
 */
const uploadBrandLogo = async (buffer, brandId) => {
  try {
    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${buffer.toString('base64')}`,
      {
        folder: `pc-adviser/brands/${brandId}`,
        public_id: `logo_${Date.now()}`,
        format: 'png',
        transformation: [
          {
            width: 200,
            height: 200,
            crop: 'fit',
            quality: 'auto:good',
            background: 'transparent'
          }
        ]
      }
    );

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    throw new Error(`Brand logo upload failed: ${error.message}`);
  }
};

/**
 * Upload category image to Cloudinary
 * @param {Buffer} buffer - Image buffer
 * @param {string} categoryId - Category ID for folder organization
 * @returns {Promise<Object>} Upload result with URL and public_id
 */
const uploadCategoryImage = async (buffer, categoryId) => {
  try {
    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${buffer.toString('base64')}`,
      {
        folder: `pc-adviser/categories/${categoryId}`,
        public_id: `image_${Date.now()}`,
        format: 'jpg',
        transformation: [
          {
            width: 400,
            height: 300,
            crop: 'fill',
            quality: 'auto:good'
          }
        ]
      }
    );

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    throw new Error(`Category image upload failed: ${error.message}`);
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image
 * @returns {Promise<Object>} Delete result
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array<string>} publicIds - Array of public IDs
 * @returns {Promise<Object>} Delete result
 */
const deleteMultipleImages = async (publicIds) => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary bulk delete failed: ${error.message}`);
  }
};

/**
 * Get optimized URL for image
 * @param {string} publicId - Public ID of the image
 * @param {Object} options - Transformation options
 * @returns {string} Optimized image URL
 */
const getOptimizedUrl = (publicId, options = {}) => {
  const {
    width = 'auto',
    height = 'auto',
    crop = 'fill',
    quality = 'auto:good',
    format = 'auto'
  } = options;

  return cloudinary.url(publicId, {
    transformation: [
      {
        width,
        height,
        crop,
        quality,
        format
      }
    ]
  });
};

/**
 * Generate responsive image URLs
 * @param {string} publicId - Public ID of the image
 * @returns {Object} Object with different sized URLs
 */
const getResponsiveUrls = (publicId) => {
  return {
    small: getOptimizedUrl(publicId, { width: 300, height: 300 }),
    medium: getOptimizedUrl(publicId, { width: 600, height: 600 }),
    large: getOptimizedUrl(publicId, { width: 1200, height: 1200 }),
    original: cloudinary.url(publicId, { quality: 'auto:good' })
  };
};

module.exports = {
  uploadProductImage,
  uploadBrandLogo,
  uploadCategoryImage,
  deleteImage,
  deleteMultipleImages,
  getOptimizedUrl,
  getResponsiveUrls
};
