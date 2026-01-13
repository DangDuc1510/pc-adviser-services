// Base Error Class
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific Error Classes
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

class UnauthorizedError extends AppError {
  constructor(message = "Không có quyền truy cập") {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Không có quyền thực hiện thao tác này") {
    super(message, 403);
  }
}

class AuthorizationError extends AppError {
  constructor(message = "Không được phép truy cập") {
    super(message, 401);
  }
}

class IdentityServiceError extends AppError {
  constructor(message = "Lỗi kết nối với Identity Service") {
    super(message, 503);
  }
}

class OrderServiceError extends AppError {
  constructor(message = "Lỗi kết nối với Order Service") {
    super(message, 503);
  }
}

class ProductServiceError extends AppError {
  constructor(message = "Lỗi kết nối với Product Service") {
    super(message, 503);
  }
}

const config = require("../config/env");

// Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (config.NODE_ENV === "development") {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // Production mode
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      // Programming or unknown error
      console.error("ERROR 💥", err);
      res.status(500).json({
        status: "error",
        message: "Đã xảy ra lỗi!",
      });
    }
  }
};

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  AuthorizationError,
  IdentityServiceError,
  OrderServiceError,
  ProductServiceError,
  errorHandler,
};

