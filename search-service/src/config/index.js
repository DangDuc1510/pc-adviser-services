require("dotenv").config();
const Joi = require("joi");

const configSchema = Joi.object({
  // Server config
  NODE_ENV: Joi.string()
    .valid("development", "staging", "production")
    .default("development"),
  PORT: Joi.number().default(8000),

  // Elasticsearch config
  ELASTICSEARCH_NODE: Joi.string().required(),
  ELASTICSEARCH_INDEX: Joi.string().default("products"),
  ELASTICSEARCH_USERNAME: Joi.string().allow("").optional(),
  ELASTICSEARCH_PASSWORD: Joi.string().allow("").optional(),

  // Redis config
  REDIS_URL: Joi.string().default("redis://localhost:6379"),
  REDIS_TTL: Joi.number().default(900), // 15 minutes

  // Product Service config
  PRODUCT_SERVICE_URL: Joi.string().default("http://localhost:3002"),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid("error", "warn", "info", "debug")
    .default("info"),

  // Cache config
  CACHE_ENABLED: Joi.boolean().default(true),
  CACHE_TTL: Joi.number().default(900), // 15 minutes

  // Search config
  SEARCH_MAX_RESULTS: Joi.number().default(100),
  SEARCH_DEFAULT_SIZE: Joi.number().default(20),
  SEARCH_MAX_SIZE: Joi.number().default(100),

  // CORS config
  CORS_ORIGIN: Joi.string().default("http://localhost:4001"),
}).unknown();

const { error, value } = configSchema.validate(process.env);

if (error) {
  throw new Error(`Configuration validation error: ${error.message}`);
}

const config = {
  env: value.NODE_ENV,
  port: value.PORT,

  elasticsearch: {
    node: value.ELASTICSEARCH_NODE,
    index: value.ELASTICSEARCH_INDEX,
    auth:
      value.ELASTICSEARCH_USERNAME && value.ELASTICSEARCH_PASSWORD
        ? {
            username: value.ELASTICSEARCH_USERNAME,
            password: value.ELASTICSEARCH_PASSWORD,
          }
        : undefined,
  },

  redis: {
    url: value.REDIS_URL,
    ttl: value.REDIS_TTL,
  },

  productService: {
    url: (() => {
      const url = value.PRODUCT_SERVICE_URL;
      if (!url || url.trim() === "") return "http://localhost:3002";
      return url.startsWith("http://") || url.startsWith("https://") 
        ? url 
        : `https://${url}`;
    })(),
  },

  logging: {
    level: value.LOG_LEVEL,
  },

  cache: {
    enabled: value.CACHE_ENABLED,
    ttl: value.CACHE_TTL,
  },

  search: {
    maxResults: value.SEARCH_MAX_RESULTS,
    defaultSize: value.SEARCH_DEFAULT_SIZE,
    maxSize: value.SEARCH_MAX_SIZE,
  },

  cors: {
    origin: value.CORS_ORIGIN,
  },
};

module.exports = config;
