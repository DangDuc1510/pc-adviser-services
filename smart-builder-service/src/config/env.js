require("dotenv").config();

const config = {
  // Server
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,

  // Database
  MONGO_URI: process.env.MONGO_URI,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,

  // Redis
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_URL: process.env.REDIS_URL,

  // External Services
  PRODUCT_SERVICE_URL: process.env.PRODUCT_SERVICE_URL,
  IDENTITY_SERVICE_URL: process.env.IDENTITY_SERVICE_URL,
  ORDER_SERVICE_URL: process.env.ORDER_SERVICE_URL,
  VOUCHER_SERVICE_URL: process.env.VOUCHER_SERVICE_URL,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN.split(","),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,

  // Cache TTL (in seconds)
  CACHE_TTL_USER_PREFERENCES: parseInt(process.env.CACHE_TTL_USER_PREFERENCES),
  CACHE_TTL_RECOMMENDATIONS: parseInt(process.env.CACHE_TTL_RECOMMENDATIONS),
  CACHE_TTL_SIMILARITY_MATRIX: parseInt(process.env.CACHE_TTL_SIMILARITY_MATRIX),

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL,
  LOG_FILE_PATH: process.env.LOG_FILE_PATH,
  LOG_ERROR_FILE_PATH: process.env.LOG_ERROR_FILE_PATH,
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
