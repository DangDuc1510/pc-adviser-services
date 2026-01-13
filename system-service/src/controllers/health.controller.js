const dbConnection = require('../config/database');
const queueConnection = require('../config/queue');
const cacheService = require('../services/cache.service');
const logger = require('../utils/logger');

const healthCheck = async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      service: 'system-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };

    res.status(200).json(health);
  } catch (error) {
    logger.error('Health check error', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      service: 'system-service',
      error: error.message,
    });
  }
};

const mongodbHealth = async (req, res) => {
  try {
    const isConnected = await dbConnection.testConnection();
    
    if (!isConnected) {
      return res.status(503).json({
        status: 'unhealthy',
        service: 'mongodb',
        message: 'Cannot connect to MongoDB',
      });
    }

    const stats = await dbConnection.connection.db.stats();
    
    res.status(200).json({
      status: 'healthy',
      service: 'mongodb',
      database: {
        name: dbConnection.connection.name,
        collections: stats.collections,
        dataSize: stats.dataSize,
      },
    });
  } catch (error) {
    logger.error('MongoDB health check error', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      service: 'mongodb',
      error: error.message,
    });
  }
};

const rabbitmqHealth = async (req, res) => {
  try {
    const isConnected = await queueConnection.testConnection();
    
    if (!isConnected) {
      return res.status(503).json({
        status: 'unhealthy',
        service: 'rabbitmq',
        message: 'Cannot connect to RabbitMQ',
      });
    }

    res.status(200).json({
      status: 'healthy',
      service: 'rabbitmq',
      connected: true,
    });
  } catch (error) {
    logger.error('RabbitMQ health check error', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      service: 'rabbitmq',
      error: error.message,
    });
  }
};

const redisHealth = async (req, res) => {
  try {
    const isConnected = await cacheService.ping();
    
    if (!isConnected) {
      return res.status(503).json({
        status: 'unhealthy',
        service: 'redis',
        message: 'Cannot connect to Redis',
      });
    }

    res.status(200).json({
      status: 'healthy',
      service: 'redis',
      enabled: cacheService.enabled,
    });
  } catch (error) {
    logger.error('Redis health check error', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      service: 'redis',
      error: error.message,
    });
  }
};

const allHealth = async (req, res) => {
  try {
    const [dbConnected, queueConnected, redisConnected] = await Promise.all([
      dbConnection.testConnection(),
      queueConnection.testConnection(),
      cacheService.ping(),
    ]);

    const health = {
      status: dbConnected && queueConnected && redisConnected ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: {
          status: dbConnected ? 'healthy' : 'unhealthy',
        },
        rabbitmq: {
          status: queueConnected ? 'healthy' : 'unhealthy',
        },
        redis: {
          status: redisConnected ? 'healthy' : 'unhealthy',
          enabled: cacheService.enabled,
        },
      },
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Combined health check error', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
};

module.exports = {
  healthCheck,
  mongodbHealth,
  rabbitmqHealth,
  redisHealth,
  allHealth,
};

