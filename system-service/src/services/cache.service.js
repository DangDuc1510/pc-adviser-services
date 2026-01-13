const Redis = require('ioredis');
const config = require('../config');
const logger = require('../utils/logger');

let redis = null;
let enabled = false;

const connect = async () => {
  if (!config.cache.enabled) {
    logger.info('Redis cache disabled');
    enabled = false;
    return;
  }

  try {
    redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redis.on('connect', () => {
      logger.info('Redis connected');
      enabled = true;
    });

    redis.on('error', (err) => {
      logger.error('Redis error', { error: err.message });
      enabled = false;
    });

    redis.on('close', () => {
      logger.warn('Redis connection closed');
      enabled = false;
    });

    // Test connection
    await redis.ping();
    enabled = true;
    logger.info('Redis cache enabled');
  } catch (error) {
    logger.warn('Redis connection failed. Cache disabled.', { error: error.message });
    enabled = false;
    redis = null;
  }
};

const disconnect = async () => {
  if (redis) {
    await redis.quit();
    redis = null;
    enabled = false;
    logger.info('Redis disconnected');
  }
};

const ping = async () => {
  if (!enabled || !redis) {
    return false;
  }

  try {
    const result = await redis.ping();
    return result === 'PONG';
  } catch (error) {
    logger.debug('Redis ping failed', { error: error.message });
    return false;
  }
};

const get = async (key) => {
  if (!enabled || !redis) {
    return null;
  }

  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Redis get error', { key, error: error.message });
    return null;
  }
};

const set = async (key, value, ttl = null) => {
  if (!enabled || !redis) {
    return false;
  }

  try {
    const serialized = JSON.stringify(value);
    const expireTime = ttl || config.cache.ttl;
    
    if (expireTime > 0) {
      await redis.setex(key, expireTime, serialized);
    } else {
      await redis.set(key, serialized);
    }
    
    return true;
  } catch (error) {
    logger.error('Redis set error', { key, error: error.message });
    return false;
  }
};

const del = async (key) => {
  if (!enabled || !redis) {
    return false;
  }

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    logger.error('Redis delete error', { key, error: error.message });
    return false;
  }
};

const exists = async (key) => {
  if (!enabled || !redis) {
    return false;
  }

  try {
    const result = await redis.exists(key);
    return result === 1;
  } catch (error) {
    logger.error('Redis exists error', { key, error: error.message });
    return false;
  }
};

const clear = async (pattern) => {
  if (!enabled || !redis) {
    return false;
  }

  try {
    const keys = await redis.keys(pattern || '*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return keys.length;
  } catch (error) {
    logger.error('Redis clear error', { pattern, error: error.message });
    return 0;
  }
};

module.exports = {
  connect,
  disconnect,
  ping,
  get,
  set,
  del,
  exists,
  clear,
  get enabled() {
    return enabled;
  },
};

