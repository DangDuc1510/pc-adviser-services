require("dotenv").config();

const config = {
  // Server
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database
  MONGO_URI:
    process.env.MONGO_URI || "mongodb://localhost:27017/identity-service",
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || "test",

  // Redis
  REDIS_URL: process.env.REDIS_URL || null,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "your-super-secret-jwt-key",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",")
    : [
        "https://pc-adviser-web.vercel.app",
        "https://pc-adviser-cms.vercel.app",
        "http://localhost:4000",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:4000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://localhost:4001",
        "http://127.0.0.1:4001",
      ],

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // requests per window

  // External Services - Normalize URLs (add https:// if missing protocol)
  ORDER_SERVICE_URL: (() => {
    const url = process.env.ORDER_SERVICE_URL || "http://localhost:3003";
    if (!url || url.trim() === "") return "http://localhost:3003";
    return url.startsWith("http://") || url.startsWith("https://") 
      ? url 
      : `https://${url}`;
  })(),
  SYSTEM_SERVICE_URL: (() => {
    const url = process.env.SYSTEM_SERVICE_URL || "http://localhost:3007";
    if (!url || url.trim() === "") return "http://localhost:3007";
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
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:4001",

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
