require("dotenv").config();

const config = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,

  // Database
  MONGO_URI: process.env.MONGO_URI,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET,

  // External Services
  IDENTITY_SERVICE_URL: process.env.IDENTITY_SERVICE_URL,
  ORDER_SERVICE_URL: process.env.ORDER_SERVICE_URL,
  PRODUCT_SERVICE_URL: process.env.PRODUCT_SERVICE_URL,

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN.split(","),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS),
};

module.exports = config;
