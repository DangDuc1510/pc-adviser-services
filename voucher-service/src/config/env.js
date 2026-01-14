require("dotenv").config();

const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3008,

  // Database
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/pc-adviser",
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || "test",
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "your_jwt_secret_here",

  // External Services
  IDENTITY_SERVICE_URL: (() => {
    const url = process.env.IDENTITY_SERVICE_URL || "http://localhost:3001";
    return url.startsWith("http") ? url : `https://${url}`;
  })(),
  ORDER_SERVICE_URL: (() => {
    const url = process.env.ORDER_SERVICE_URL || "http://localhost:3003";
    return url.startsWith("http") ? url : `https://${url}`;
  })(),
  PRODUCT_SERVICE_URL: (() => {
    const url = process.env.PRODUCT_SERVICE_URL || "http://localhost:3002";
    return url.startsWith("http") ? url : `https://${url}`;
  })(),

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
        "http://localhost:3003",
        "http://127.0.0.1:3003",
        "http://localhost:4001",
        "http://127.0.0.1:4001",
      ],

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
};

module.exports = config;

