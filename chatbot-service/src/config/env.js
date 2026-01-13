require('dotenv').config();

const config = {
  // Server
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/chatbot_db',
  
  // Redis
  REDIS_URL: process.env.REDIS_URL || null,
  REDIS_SESSION_TTL: parseInt(process.env.REDIS_SESSION_TTL) || 3600, // 1 hour default
  
  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4',
  OPENAI_MAX_TOKENS: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000,
  OPENAI_TEMPERATURE: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
    'http://localhost:4000',
    'http://localhost:3000',
    'http://127.0.0.1:4000',
    'http://127.0.0.1:3000'
  ],
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 20, // 20 requests per minute
  
  // Message constraints
  MESSAGE_MAX_LENGTH: parseInt(process.env.MESSAGE_MAX_LENGTH) || 1000,
  
  // Service URLs for integration
  PRODUCT_SERVICE_URL: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
  ORDER_SERVICE_URL: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
  BUILDER_SERVICE_URL: process.env.BUILDER_SERVICE_URL || 'http://localhost:3004',
  
  // JWT (optional for authenticated users)
  JWT_SECRET: process.env.JWT_SECRET || null,
  
  // Session
  SESSION_EXPIRE_SECONDS: parseInt(process.env.SESSION_EXPIRE_SECONDS) || 3600, // 1 hour
};

// Validate required environment variables
const requiredVars = ['MONGO_URI'];
if (config.NODE_ENV === 'production') {
  requiredVars.push('OPENAI_API_KEY');
}

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`Error: Required environment variable ${varName} is not set`);
    process.exit(1);
  }
}

module.exports = config;

