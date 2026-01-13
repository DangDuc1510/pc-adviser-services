const express = require('express');
const router = express.Router();
const integrationService = require('../services/integration.service');
const { getRedisClient } = require('../config/redis');
const mongoose = require('mongoose');

/**
 * Health check endpoint
 */
router.get('/', async (req, res) => {
  const health = {
    status: 'OK',
    service: 'Chatbot Service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: false,
      redis: false,
      externalServices: {}
    }
  };

  // Check MongoDB
  try {
    if (mongoose.connection.readyState === 1) {
      health.checks.database = true;
    }
  } catch (error) {
    health.checks.database = false;
  }

  // Check Redis
  try {
    const redisClient = getRedisClient();
    if (redisClient && redisClient.isReady) {
      health.checks.redis = true;
    }
  } catch (error) {
    health.checks.redis = false;
  }

  // Check external services
  try {
    health.checks.externalServices = await integrationService.checkServicesHealth();
  } catch (error) {
    // Non-critical, just log
  }

  const allChecksPassed = 
    health.checks.database &&
    Object.values(health.checks.externalServices).every(status => status === true || status === false);

  const statusCode = allChecksPassed ? 200 : 503;
  health.status = allChecksPassed ? 'OK' : 'DEGRADED';

  res.status(statusCode).json(health);
});

module.exports = router;

