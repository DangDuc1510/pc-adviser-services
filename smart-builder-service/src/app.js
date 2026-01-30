const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const config = require("./config/env");
const { connectDatabase } = require("./config/database");
const { connectRedis } = require("./config/redis");
const optimizationConfig = require("./utils/optimization-config");
const { errorHandler } = require("./errors");
const logger = require("./utils/logger");

const recommendationRoutes = require("./routes/recommendation.routes");
const segmentationRoutes = require("./routes/segmentation.routes");

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  })
);

// Logging
// Use morgan to log HTTP requests
// When output is redirected (via start-all.sh), use 'combined' format (no colors)
// When running directly, use 'dev' format (with colors)
const morganFormat =
  process.stdout.isTTY && config.NODE_ENV === "development"
    ? "dev"
    : "combined";
app.use(morgan(morganFormat));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: "Quá nhiều requests, vui lòng thử lại sau",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "Smart Builder Service",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});


app.use("/recommendations", recommendationRoutes);

app.use("/segmentation", segmentationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Connect to Redis (optional - don't fail if unavailable)
    try {
      await connectRedis();
    } catch (redisErr) {
      logger.warn('Redis connection failed, continuing without cache:', redisErr.message);
    }

    // Log optimization features status
    if (optimizationConfig.FEATURES.ELASTICSEARCH_RETRIEVAL) {
      logger.info('Optimization features enabled - using search-service for retrieval');
      logger.info(`Search Service URL: ${config.SEARCH_SERVICE_URL}`);
    }

    // Start listening
    app.listen(config.PORT, () => {
      logger.info(`Smart Builder Service running on port ${config.PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
      logger.info(`Product Service: ${config.PRODUCT_SERVICE_URL}`);
      logger.info(`Identity Service: ${config.IDENTITY_SERVICE_URL}`);
      logger.info(`Order Service: ${config.ORDER_SERVICE_URL}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
