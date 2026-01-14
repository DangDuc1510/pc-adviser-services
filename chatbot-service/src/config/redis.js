const redis = require("redis");
const config = require("./env");

let client = null;

// Chỉ tạo Redis client nếu REDIS_URL được cấu hình
if (config.REDIS_URL) {
  client = redis.createClient({ url: config.REDIS_URL });
  client.on("error", (err) => console.error("Redis Client Error", err));
  client.on("connect", () => console.log("Redis client connecting..."));
  client.on("ready", () => console.log("✅ Redis client ready"));
}

const connectRedis = async () => {
  if (!client) {
    console.log("⚠️  Redis URL not configured, skipping Redis connection");
    return null;
  }

  try {
    await client.connect();
    console.log("✅ Redis connected successfully");
    return client;
  } catch (err) {
    console.error("❌ Failed to connect to Redis:", err);
    console.warn(
      "⚠️  Continuing without Redis cache - service will still function"
    );
    // Don't throw - allow service to start without Redis
    return null;
  }
};

const getRedisClient = () => {
  return client;
};

// Graceful shutdown
process.on("SIGINT", async () => {
  if (client) {
    try {
      await client.quit();
      console.log("Redis connection closed through app termination");
    } catch (error) {
      console.error("Error closing Redis connection:", error);
    }
  }
});

process.on("SIGTERM", async () => {
  if (client) {
    try {
      await client.quit();
      console.log("Redis connection closed through app termination");
    } catch (error) {
      console.error("Error closing Redis connection:", error);
    }
  }
});

module.exports = { client, connectRedis, getRedisClient };
