const redis = require('redis');
const config = require('./env');
let client = null;

// Chỉ tạo Redis client nếu REDIS_URL được cấu hình
if (config.REDIS_URL) {
  client = redis.createClient({ url: config.REDIS_URL });
  client.on('error', err => console.error('Redis Client Error', err));
}

const connectRedis = async () => {
  if (!client) {
    console.log('Redis URL not configured, skipping Redis connection');
    return;
  }
  
  try {
    await client.connect();
    console.log('Redis connected successfully');
  } catch (err) {
    console.error('Failed to connect to Redis', err);
    throw err;
  }
};

module.exports = { client, connectRedis }; 