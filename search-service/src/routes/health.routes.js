const express = require('express');
const router = express.Router();
const { client, testConnection } = require('../elastic/client');
const cacheService = require('../services/cache.service');
const logger = require('../utils/logger');

// General health check
router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      service: 'search-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };

    res.status(200).json(health);
  } catch (error) {
    logger.error('Health check error', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      service: 'search-service',
      error: error.message,
    });
  }
});

// Elasticsearch health check
router.get('/elasticsearch', async (req, res) => {
  try {
    const isConnected = await testConnection();
    
    if (!isConnected) {
      return res.status(503).json({
        status: 'unhealthy',
        service: 'elasticsearch',
        message: 'Cannot connect to Elasticsearch',
      });
    }

    const clusterHealth = await client.cluster.health();
    
    res.status(200).json({
      status: 'healthy',
      service: 'elasticsearch',
      cluster: {
        status: clusterHealth.status,
        number_of_nodes: clusterHealth.number_of_nodes,
        active_primary_shards: clusterHealth.active_primary_shards,
      },
    });
  } catch (error) {
    logger.error('Elasticsearch health check error', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      service: 'elasticsearch',
      error: error.message,
    });
  }
});

// Redis health check
router.get('/redis', async (req, res) => {
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
});

// Combined health check (all services)
router.get('/all', async (req, res) => {
  try {
    const [esConnected, redisConnected] = await Promise.all([
      testConnection(),
      cacheService.ping(),
    ]);

    const health = {
      status: esConnected && redisConnected ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        elasticsearch: {
          status: esConnected ? 'healthy' : 'unhealthy',
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
});

module.exports = router;

