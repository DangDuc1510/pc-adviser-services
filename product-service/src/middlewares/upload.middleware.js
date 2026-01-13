const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for images
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    // Accept only common image formats
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận các định dạng ảnh: JPEG, PNG, WebP'), false);
    }
  } else {
    cb(new Error('File tải lên phải là ảnh'), false);
  }
};

// Product images upload configuration
const uploadProductImages = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size per image
    files: 10 // Maximum 10 images per product
  },
  fileFilter
}).array('images', 10);

// Single product image upload
const uploadSingleProductImage = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 1
  },
  fileFilter
}).single('image');

// Brand logo upload configuration
const uploadBrandLogo = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 1
  },
  fileFilter
}).single('logo');

// Category image upload configuration
const uploadCategoryImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 1
  },
  fileFilter
}).single('image');

// Error handling middleware generator
const createUploadHandler = (uploadFunction) => {
  return (req, res, next) => {
    uploadFunction(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            status: 'error',
            message: 'File quá lớn. Kích thước tối đa cho phép là 10MB'
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            status: 'error',
            message: 'Quá nhiều file. Tối đa 10 ảnh cho mỗi sản phẩm'
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            status: 'error',
            message: 'Tên field không đúng'
          });
        }
      }
      
      if (err) {
        return res.status(400).json({
          status: 'error',
          message: err.message
        });
      }
      
      next();
    });
  };
};

// Export configured middleware handlers
const handleProductImagesUpload = createUploadHandler(uploadProductImages);
const handleSingleProductImageUpload = createUploadHandler(uploadSingleProductImage);
const handleBrandLogoUpload = createUploadHandler(uploadBrandLogo);
const handleCategoryImageUpload = createUploadHandler(uploadCategoryImage);

module.exports = {
  handleProductImagesUpload,
  handleSingleProductImageUpload,
  handleBrandLogoUpload,
  handleCategoryImageUpload
};
