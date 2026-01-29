require("dotenv").config();

const config = {
  // Server
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,

  // Database
  MONGO_URI: process.env.MONGO_URI,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN.split(","),

  // File upload
  UPLOAD_PATH: process.env.UPLOAD_PATH,
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE,

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,

  // Image processing
  IMAGE_QUALITY: process.env.IMAGE_QUALITY,
  THUMBNAIL_SIZE: process.env.THUMBNAIL_SIZE,

  // Search
  SEARCH_LIMIT: process.env.SEARCH_LIMIT,

  // Cache
  CACHE_TTL: process.env.CACHE_TTL,

  // Cloudinary
  CLOUDINARY_URL: process.env.CLOUDINARY_URL,

  // Search Service
  SEARCH_SERVICE_URL: process.env.SEARCH_SERVICE_URL,
  SEARCH_SERVICE_ENABLED: process.env.SEARCH_SERVICE_ENABLED !== "false",

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
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
