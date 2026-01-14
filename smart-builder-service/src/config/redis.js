const redis = require("redis");
const config = require("./env");
const logger = require("../utils/logger");

let client = null;

// Create Redis client - Only use REDIS_URL (for Render/production)
// Don't fallback to REDIS_HOST in production to avoid connection errors
if (config.REDIS_URL) {
  client = redis.createClient({ url: config.REDIS_URL });
} else if (config.REDIS_HOST && config.NODE_ENV !== "production") {
  // Only use REDIS_HOST for local development
  const redisConfig = {
    socket: {
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
    },
  };

  if (config.REDIS_PASSWORD) {
    redisConfig.password = config.REDIS_PASSWORD;
  }

  client = redis.createClient(redisConfig);
}

if (client) {
  client.on("error", (err) => logger.error("Redis Client Error", err));
  client.on("connect", () => logger.info("Redis Client connecting..."));
  client.on("ready", () => logger.info("Redis Client ready"));
}

const connectRedis = async () => {
  if (!client) {
    logger.info("Redis not configured, skipping Redis connection");
    return null;
  }

  try {
    await client.connect();
    logger.info("Redis connected successfully");
    return client;
  } catch (err) {
    logger.error("Failed to connect to Redis", err);
    logger.warn("Continuing without Redis cache");
    return null;
  }
};

module.exports = { client, connectRedis };
