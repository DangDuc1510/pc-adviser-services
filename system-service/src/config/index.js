require("dotenv").config();
const Joi = require("joi");

const configSchema = Joi.object({
  // Server config
  NODE_ENV: Joi.string()
    .valid("development", "staging", "production")
    .default("development"),
  PORT: Joi.number().default(3007),

  // MongoDB config
  MONGO_URI: Joi.string().required(),

  // Redis config
  REDIS_HOST: Joi.string().default("localhost"),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow("").optional(),
  REDIS_URL: Joi.string().optional(),
  REDIS_TTL: Joi.number().default(900), // 15 minutes

  // RabbitMQ config (for health check)
  RABBITMQ_URL: Joi.string().default("amqp://localhost:5672"),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid("error", "warn", "info", "debug")
    .default("info"),

  // Monitoring
  PROMETHEUS_ENABLED: Joi.boolean().default(false),

  // Cache config
  CACHE_ENABLED: Joi.boolean().default(true),
  CACHE_TTL: Joi.number().default(900), // 15 minutes

  // Email config
  SMTP_HOST: Joi.string().default("smtp.gmail.com"),
  SMTP_PORT: Joi.number().default(587),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().email().optional(),
  SMTP_PASS: Joi.string().optional(),
  EMAIL_FROM: Joi.string().email().optional(),
  EMAIL_FROM_NAME: Joi.string().default("PC Adviser"),
}).unknown();

const { error, value } = configSchema.validate(process.env);

if (error) {
  throw new Error(`Configuration validation error: ${error.message}`);
}

const config = {
  env: value.NODE_ENV,
  port: value.PORT,

  mongodb: {
    uri: value.MONGO_URI,
  },

  redis: {
    host: value.REDIS_HOST,
    port: value.REDIS_PORT,
    password: value.REDIS_PASSWORD || undefined,
    // Use REDIS_URL if available, otherwise construct from host/port (for Docker use REDIS_URL)
    url: value.REDIS_URL || (value.REDIS_HOST && value.REDIS_HOST !== 'localhost' ? `redis://${value.REDIS_HOST}:${value.REDIS_PORT}` : null),
    ttl: value.REDIS_TTL,
  },

  rabbitmq: {
    url: value.RABBITMQ_URL,
  },

  logging: {
    level: value.LOG_LEVEL,
  },

  monitoring: {
    prometheusEnabled: value.PROMETHEUS_ENABLED,
  },

  cors: {
    origin: value.CORS_ORIGIN ? value.CORS_ORIGIN.split(",") : [
      "https://pc-adviser-web.vercel.app",
      "https://pc-adviser-cms.vercel.app",
      "http://localhost:4000",
      "http://localhost:4001",
    ],
  },

  cache: {
    enabled: value.CACHE_ENABLED,
    ttl: value.CACHE_TTL,
  },

  email: {
    smtp: {
      host: value.SMTP_HOST,
      port: value.SMTP_PORT,
      secure: value.SMTP_SECURE,
      auth: {
        user: value.SMTP_USER,
        pass: value.SMTP_PASS,
      },
    },
    from: value.EMAIL_FROM || value.SMTP_USER,
    fromName: value.EMAIL_FROM_NAME,
  },
};

module.exports = config;
