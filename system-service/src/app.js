require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const config = require("./config");
const logger = require("./utils/logger");
const dbConnection = require("./config/database");
const cacheService = require("./services/cache.service");

// Routes
const healthRoutes = require("./routes/health.routes");
const statisticsRoutes = require("./routes/statistics.routes");
const emailRoutes = require("./routes/email.routes");

// Middleware
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use((req, res, next) => {
  logger.info("Incoming request", {
    method: req.method,
    path: req.path,
    query: req.query,
  });
  next();
});

// Routes
app.use("/health", healthRoutes);
app.use("/statistics", statisticsRoutes);
app.use("/email", emailRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "system-service",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/health",
      statistics: "/statistics",
      email: "/email",
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Not found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Startup function
async function start() {
  try {
    // Connect to MongoDB
    await dbConnection.connect();

    // Connect to Redis
    await cacheService.connect();

    // Start server
    app.listen(config.port, () => {
      logger.info(`System Service running on port ${config.port}`, {
        environment: config.env,
        port: config.port,
      });
    });
  } catch (error) {
    logger.error("Failed to start service", { error: error.message });
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);

  try {
    // Close HTTP server
    await new Promise((resolve) => {
      if (app.listening) {
        app.close(() => {
          logger.info("HTTP server closed");
          resolve();
        });
      } else {
        resolve();
      }
    });

    // Disconnect from Redis
    await cacheService.disconnect();

    // Disconnect from MongoDB
    await dbConnection.disconnect();

    logger.info("Shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown", { error: error.message });
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Handle unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection", {
    reason: reason?.message || reason,
    stack: reason?.stack,
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Start the server
start();
