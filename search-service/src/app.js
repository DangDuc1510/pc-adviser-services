require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const config = require('./config');
const logger = require('./utils/logger');
const cacheService = require('./services/cache.service');
const { testConnection } = require('./elastic/client');

// Routes
const searchRoutes = require('./routes/search.routes');
const healthRoutes = require('./routes/health.routes');

// Middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  })
);

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
  });
  next();
});

// Routes
app.use('/health', healthRoutes);
app.use('/search', searchRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'search-service',
    version: '1.0.0',
    status: 'running',
      endpoints: {
        health: '/health',
        search: '/search',
        searchProducts: '/search/products',
        autocomplete: '/search/autocomplete',
        webhook: '/search/webhook/product',
      },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Startup function
async function start() {
  try {
    // Connect to Redis
    await cacheService.connect();

    // Test Elasticsearch connection
    const esConnected = await testConnection();
    if (!esConnected) {
      logger.warn('Elasticsearch connection failed. Service may not function correctly.');
    }

    logger.info('Using API webhook for product indexing');

    // Start server
    app.listen(config.port, () => {
      logger.info(`Search Service running on port ${config.port}`, {
        environment: config.env,
        port: config.port,
      });
    });
  } catch (error) {
    logger.error('Failed to start service', { error: error.message });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await cacheService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await cacheService.disconnect();
  process.exit(0);
});

// Start the server
start(); 