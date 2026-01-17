require("dotenv").config();

const config = {
  // Server
  PORT: process.env.PORT || 3006,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/smart-builder",
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || "smart-builder",

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: process.env.REDIS_PORT || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
  REDIS_URL: process.env.REDIS_URL || null,

  // External Services - Normalize URLs (add https:// if missing protocol)
  PRODUCT_SERVICE_URL: (() => {
    const url = process.env.PRODUCT_SERVICE_URL || "http://localhost:3003";
    if (!url || url.trim() === "") return "http://localhost:3003";
    return url.startsWith("http://") || url.startsWith("https://") 
      ? url 
      : `https://${url}`;
  })(),
  IDENTITY_SERVICE_URL: (() => {
    const url = process.env.IDENTITY_SERVICE_URL || "http://localhost:3001";
    if (!url || url.trim() === "") return "http://localhost:3001";
    return url.startsWith("http://") || url.startsWith("https://") 
      ? url 
      : `https://${url}`;
  })(),
  ORDER_SERVICE_URL: (() => {
    const url = process.env.ORDER_SERVICE_URL || "http://localhost:3004";
    if (!url || url.trim() === "") return "http://localhost:3004";
    return url.startsWith("http://") || url.startsWith("https://") 
      ? url 
      : `https://${url}`;
  })(),
  VOUCHER_SERVICE_URL: (() => {
    const url = process.env.VOUCHER_SERVICE_URL || "http://localhost:3008";
    if (!url || url.trim() === "") return "http://localhost:3008";
    return url.startsWith("http://") || url.startsWith("https://") 
      ? url 
      : `https://${url}`;
  })(),

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "ducbd1510",

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",")
    : [
        "https://pc-adviser-web.vercel.app",
        "https://pc-adviser-cms.vercel.app",
        "http://localhost:4000",
        "http://localhost:3000",
        "http://127.0.0.1:4000",
        "http://127.0.0.1:3000",
      ],

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || 100,

  // Cache TTL (in seconds)
  CACHE_TTL_USER_PREFERENCES:
    parseInt(process.env.CACHE_TTL_USER_PREFERENCES) || 3600,
  CACHE_TTL_RECOMMENDATIONS:
    parseInt(process.env.CACHE_TTL_RECOMMENDATIONS) || 1800,
  CACHE_TTL_SIMILARITY_MATRIX:
    parseInt(process.env.CACHE_TTL_SIMILARITY_MATRIX) || 86400,

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  LOG_FILE_PATH:
    process.env.LOG_FILE_PATH || "../logs/smart-builder-service.log",
  LOG_ERROR_FILE_PATH:
    process.env.LOG_ERROR_FILE_PATH ||
    "../logs/smart-builder-service-error.log",
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
