require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const config = require("./config/env");
const { connectDatabase } = require("./config/database");
const { errorHandler } = require("./errors");

// Load models to ensure they are registered before use
require("./models/order.model"); // Keep for vnpay service
require("./models/cart.model");

const cartRoutes = require("./routes/cart.routes");
const vnpayRoutes = require("./routes/vnpay.routes");
const paymentRoutes = require("./routes/payment.routes");
const orderRoutes = require("./routes/order.routes");

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
if (config.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: "Quá nhiều requests, vui lòng thử lại sau",
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
    service: "Order Service",
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

// Routes
app.use("/cart", cartRoutes);
app.use("/payment/vnpay", vnpayRoutes);
app.use("/payment", paymentRoutes);
app.use("/orders", orderRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route không tồn tại",
    path: req.originalUrl,
  });
});

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(config.PORT, () => {
      console.log("=".repeat(50));
      console.log(`🚀 Order Service running on port ${config.PORT}`);
      console.log(`📊 Environment: ${config.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${config.PORT}/health`);
      console.log("=".repeat(50));
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();

module.exports = app;
