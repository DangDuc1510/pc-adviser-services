const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');

router.get('/', healthController.healthCheck);
router.get('/mongodb', healthController.mongodbHealth);
router.get('/rabbitmq', healthController.rabbitmqHealth);
router.get('/redis', healthController.redisHealth);
router.get('/all', healthController.allHealth);

module.exports = router;

