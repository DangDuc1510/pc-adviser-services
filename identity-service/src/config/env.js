require("dotenv").config();

const config = {
  // Server
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,

  // Database
  MONGO_URI: process.env.MONGO_URI,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,

  // Redis
  REDIS_URL: process.env.REDIS_URL,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN.split(","),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,

  // External Services
  ORDER_SERVICE_URL: process.env.ORDER_SERVICE_URL,
  SYSTEM_SERVICE_URL: process.env.SYSTEM_SERVICE_URL,
  VOUCHER_SERVICE_URL: process.env.VOUCHER_SERVICE_URL,
  FRONTEND_URL: process.env.FRONTEND_URL,

  // Cloudinary
  CLOUDINARY_URL: process.env.CLOUDINARY_URL,
};

// Validate required environment variables
const requiredVars = ["MONGO_URI", "JWT_SECRET"];
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`Error: Required environment variable ${varName} is not set`);
    process.exit(1);
  }
}

module.exports = config;
