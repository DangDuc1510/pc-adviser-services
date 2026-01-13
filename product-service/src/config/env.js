require("dotenv").config();

const config = {
  // Server
  PORT: process.env.PORT || 3002,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database
  MONGO_URI:
    process.env.MONGO_URI || "mongodb://localhost:27017/product-service",
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || "test",

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",")
    : [
        "http://localhost:4000",
        "http://localhost:3000",
        "http://127.0.0.1:4000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        "http://localhost:4001",
        "http://127.0.0.1:4001",
      ],

  // File upload
  UPLOAD_PATH: process.env.UPLOAD_PATH || "./uploads",
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || "5mb",

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // requests per window

  // Image processing
  IMAGE_QUALITY: process.env.IMAGE_QUALITY || 85,
  THUMBNAIL_SIZE: process.env.THUMBNAIL_SIZE || 300,

  // Search
  SEARCH_LIMIT: process.env.SEARCH_LIMIT || 50,

  // Cache
  CACHE_TTL: process.env.CACHE_TTL || 300, // 5 minutes in seconds

  // Cloudinary
  CLOUDINARY_URL: process.env.CLOUDINARY_URL,

  // Search Service
  SEARCH_SERVICE_URL: process.env.SEARCH_SERVICE_URL || "http://localhost:8000",
  SEARCH_SERVICE_ENABLED: process.env.SEARCH_SERVICE_ENABLED !== "false", // Default: enabled

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "your-secret-key",
};

// Validate required environment variables
const requiredVars = ["MONGO_URI"];
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`Error: Required environment variable ${varName} is not set`);
    process.exit(1);
  }
}

module.exports = config;
