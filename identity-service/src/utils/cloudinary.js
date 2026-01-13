const cloudinary = require('cloudinary').v2;
const config = require('../config/env');

// Configure Cloudinary
if (config.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: config.CLOUDINARY_URL
  });
}

/**
 * Upload avatar image to Cloudinary
 * @param {Buffer} buffer - Image buffer
 * @param {string} userId - User ID for folder organization
 * @returns {Promise<Object>} Upload result with URL and public_id
 */
const uploadAvatar = async (buffer, userId) => {
  try {
    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${buffer.toString('base64')}`,
      {
        folder: `pc-adviser/avatars/${userId}`,
        public_id: `avatar_${Date.now()}`,
        format: 'jpg',
        transformation: [
          {
            width: 400,
            height: 400,
            crop: 'fill',
            gravity: 'face',
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
    throw new Error(`Cloudinary upload failed: ${error.message}`);
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

module.exports = {
  uploadAvatar,
  deleteImage,
  deleteMultipleImages,
  getOptimizedUrl
};
