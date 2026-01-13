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

// Avatar upload configuration
const uploadAvatar = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 1 // Only 1 file at a time
  },
  fileFilter
}).single('avatar');

// Middleware wrapper with error handling
const handleAvatarUpload = (req, res, next) => {
  uploadAvatar(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          status: 'error',
          message: 'File quá lớn. Kích thước tối đa cho phép là 5MB'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          status: 'error',
          message: 'Chỉ được tải lên 1 ảnh'
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          status: 'error',
          message: 'Tên field không đúng. Sử dụng "avatar"'
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

module.exports = {
  handleAvatarUpload
};
