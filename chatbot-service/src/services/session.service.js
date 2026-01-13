const { v4: uuidv4 } = require('uuid');
const { getRedisClient } = require('../config/redis');
const config = require('../config/env');
const logger = require('../utils/logger');

const SESSION_PREFIX = 'chat:session:';
const CONTEXT_PREFIX = 'chat:context:';

class SessionService {
  constructor() {
    this.redisClient = getRedisClient();
  }

  /**
   * Generate a new session ID
   */
  generateSessionId() {
    return uuidv4();
  }

  /**
   * Get session data from Redis
   */
  async getSession(sessionId) {
    if (!this.redisClient) {
      return null;
    }

    try {
      const key = `${SESSION_PREFIX}${sessionId}`;
      const data = await this.redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error getting session from Redis:', error);
      return null;
    }
  }

  /**
   * Save session data to Redis
   */
  async saveSession(sessionId, sessionData, ttl = config.REDIS_SESSION_TTL) {
    if (!this.redisClient) {
      return;
    }

    try {
      const key = `${SESSION_PREFIX}${sessionId}`;
      await this.redisClient.setEx(key, ttl, JSON.stringify(sessionData));
    } catch (error) {
      logger.error('Error saving session to Redis:', error);
      throw error;
    }
  }

  /**
   * Delete session from Redis
   */
  async deleteSession(sessionId) {
    if (!this.redisClient) {
      return;
    }

    try {
      const key = `${SESSION_PREFIX}${sessionId}`;
      await this.redisClient.del(key);
      
      // Also delete context
      const contextKey = `${CONTEXT_PREFIX}${sessionId}`;
      await this.redisClient.del(contextKey);
    } catch (error) {
      logger.error('Error deleting session from Redis:', error);
      throw error;
    }
  }

  /**
   * Get conversation context from Redis
   */
  async getContext(sessionId) {
    if (!this.redisClient) {
      return null;
    }

    try {
      const key = `${CONTEXT_PREFIX}${sessionId}`;
      const data = await this.redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error getting context from Redis:', error);
      return null;
    }
  }

  /**
   * Save conversation context to Redis
   */
  async saveContext(sessionId, context, ttl = config.REDIS_SESSION_TTL) {
    if (!this.redisClient) {
      return;
    }

    try {
      const key = `${CONTEXT_PREFIX}${sessionId}`;
      await this.redisClient.setEx(key, ttl, JSON.stringify(context));
    } catch (error) {
      logger.error('Error saving context to Redis:', error);
      throw error;
    }
  }

  /**
   * Update session TTL (refresh expiration time)
   */
  async refreshSession(sessionId, ttl = config.REDIS_SESSION_TTL) {
    if (!this.redisClient) {
      return;
    }

    try {
      const key = `${SESSION_PREFIX}${sessionId}`;
      const exists = await this.redisClient.exists(key);
      if (exists) {
        await this.redisClient.expire(key, ttl);
      }

      const contextKey = `${CONTEXT_PREFIX}${sessionId}`;
      const contextExists = await this.redisClient.exists(contextKey);
      if (contextExists) {
        await this.redisClient.expire(contextKey, ttl);
      }
    } catch (error) {
      logger.error('Error refreshing session:', error);
      throw error;
    }
  }

  /**
   * Add message to session history in Redis (for quick access)
   */
  async addMessageToHistory(sessionId, message, maxHistory = 20) {
    if (!this.redisClient) {
      return;
    }

    try {
      const key = `${SESSION_PREFIX}${sessionId}:history`;
      await this.redisClient.lPush(key, JSON.stringify(message));
      await this.redisClient.lTrim(key, 0, maxHistory - 1);
      await this.redisClient.expire(key, config.REDIS_SESSION_TTL);
    } catch (error) {
      logger.error('Error adding message to history:', error);
    }
  }

  /**
   * Get message history from Redis
   */
  async getMessageHistory(sessionId, limit = 20) {
    if (!this.redisClient) {
      return [];
    }

    try {
      const key = `${SESSION_PREFIX}${sessionId}:history`;
      const messages = await this.redisClient.lRange(key, 0, limit - 1);
      return messages.map(msg => JSON.parse(msg));
    } catch (error) {
      logger.error('Error getting message history:', error);
      return [];
    }
  }
}

module.exports = new SessionService();

