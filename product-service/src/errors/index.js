class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = "Dữ liệu không hợp lệ") {
    super(message, 400);
  }
}

class NotFoundError extends AppError {
  constructor(message = "Không tìm thấy tài nguyên") {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = "Xung đột dữ liệu") {
    super(message, 409);
  }
}

class DatabaseError extends AppError {
  constructor(message = "Lỗi cơ sở dữ liệu") {
    super(message, 500);
  }
}

class FileUploadError extends AppError {
  constructor(message = "Lỗi tải lên file") {
    super(message, 400);
  }
}

class ProductNotFoundError extends NotFoundError {
  constructor(message = "Không tìm thấy sản phẩm") {
    super(message);
  }
}

class CategoryNotFoundError extends NotFoundError {
  constructor(message = "Không tìm thấy danh mục") {
    super(message);
  }
}

class BrandNotFoundError extends NotFoundError {
  constructor(message = "Không tìm thấy thương hiệu") {
    super(message);
  }
}

class SKUExistsError extends ConflictError {
  constructor(message = "Mã SKU đã tồn tại") {
    super(message);
  }
}

class SlugExistsError extends ConflictError {
  constructor(message = "Đường dẫn slug đã tồn tại") {
    super(message);
  }
}

class InsufficientStockError extends ValidationError {
  constructor(message = "Không đủ hàng trong kho") {
    super(message);
  }
}

class InvalidPriceError extends ValidationError {
  constructor(message = "Giá sản phẩm không hợp lệ") {
    super(message);
  }
}

class ProductGroupNotFoundError extends NotFoundError {
  constructor(message = "Không tìm thấy nhóm sản phẩm") {
    super(message);
  }
}

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message } = err;

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((val) => val.message);
    message = `Lỗi validation: ${errors.join(", ")}`;
    statusCode = 400;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    message = `${field} "${value}" đã tồn tại`;
    statusCode = 409;
  }

  // MongoDB CastError
  if (err.name === "CastError") {
    message = "ID không hợp lệ";
    statusCode = 400;
  }

  // Multer file upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    message = "File quá lớn. Kích thước tối đa cho phép là 5MB";
    statusCode = 400;
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    message = "Quá nhiều file. Tối đa 10 ảnh cho mỗi sản phẩm";
    statusCode = 400;
  }

  if (err.code === "INVALID_FILE_TYPE") {
    message = "Loại file không được hỗ trợ. Chỉ chấp nhận JPG, PNG, WebP";
    statusCode = 400;
  }

  // Log error in development
  if (process.env.NODE_ENV === "development") {
    console.error("Error Stack:", err.stack);
  }

  res.status(statusCode).json({
    status: "error",
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  FileUploadError,
  ProductNotFoundError,
  CategoryNotFoundError,
  BrandNotFoundError,
  SKUExistsError,
  SlugExistsError,
  InsufficientStockError,
  InvalidPriceError,
  ProductGroupNotFoundError,
  errorHandler,
};
