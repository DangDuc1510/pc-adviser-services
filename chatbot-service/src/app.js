const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config/env');
const { connectDatabase } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { errorHandler } = require('./errors');
const logger = require('./utils/logger');

const chatRoutes = require('./routes/chat.routes');
const knowledgeRoutes = require('./routes/knowledge.routes');
const healthRoutes = require('./routes/health.routes');

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true
}));

// Logging
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS * 2, // 2 minutes
  max: config.RATE_LIMIT_MAX_REQUESTS * 2, // More lenient for general API
  message: {
    error: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.use('/health', healthRoutes);

// API Routes
app.use('/chat', chatRoutes);
app.use('/knowledge', knowledgeRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDatabase();
    
    // Redis is optional, so we don't fail if it's not available
    try {
      await connectRedis();
    } catch (error) {
      logger.warn('Redis connection failed, continuing without Redis:', error.message);
    }
    
    app.listen(config.PORT, () => {
      logger.info(`🚀 Chatbot Service running on port ${config.PORT}`);
      logger.info(`📊 Environment: ${config.NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${config.PORT}/health`);
      console.log('='.repeat(50));
    });
  } catch (err) {
    logger.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

module.exports = app;
