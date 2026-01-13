const Redis = require('ioredis');
const config = require('../config');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.redis = null;
    this.enabled = config.cache.enabled;
    this.defaultTTL = config.cache.ttl;
  }

  async connect() {
    if (!this.enabled) {
      logger.warn('Cache is disabled');
      return;
    }

    try {
      this.redis = new Redis(config.redis.url, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      this.redis.on('connect', () => {
        logger.info('Redis connection established');
      });

      this.redis.on('error', (error) => {
        logger.error('Redis connection error', { error: error.message });
      });

      // Test connection
      await this.redis.ping();
      logger.info('Redis connection successful');
    } catch (error) {
      logger.error('Failed to connect to Redis', { error: error.message });
      this.enabled = false;
      this.redis = null;
    }
  }

  async disconnect() {
    if (this.redis) {
      await this.redis.quit();
      logger.info('Redis connection closed');
    }
  }

  async get(key) {
    if (!this.enabled || !this.redis) {
      return null;
    }

    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error', { error: error.message, key });
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    if (!this.enabled || !this.redis) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttl > 0) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error('Cache set error', { error: error.message, key });
      return false;
    }
  }

  async del(key) {
    if (!this.enabled || !this.redis) {
      return false;
    }

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error', { error: error.message, key });
      return false;
    }
  }

  async delPattern(pattern) {
    if (!this.enabled || !this.redis) {
      return false;
    }

    try {
      const stream = this.redis.scanStream({
        match: pattern,
        count: 100,
      });

      let deletedCount = 0;
      stream.on('data', async (keys) => {
        if (keys.length > 0) {
          await this.redis.del(...keys);
          deletedCount += keys.length;
        }
      });

      return new Promise((resolve) => {
        stream.on('end', () => {
          logger.info(`Cache pattern deleted: ${pattern}, count: ${deletedCount}`);
          resolve(deletedCount);
        });
      });
    } catch (error) {
      logger.error('Cache pattern delete error', { error: error.message, pattern });
      return false;
    }
  }

  async ping() {
    if (!this.enabled || !this.redis) {
      return false;
    }

    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }

  generateCacheKey(prefix, ...parts) {
    return `${prefix}:${parts.join(':')}`;
  }
}

module.exports = new CacheService();

