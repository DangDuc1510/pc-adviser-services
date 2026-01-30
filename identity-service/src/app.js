const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const config = require("./config/env");
const { connectDatabase } = require("./config/database");
const { connectRedis } = require("./config/redis");
const { errorHandler } = require("./errors");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const customerRoutes = require("./routes/customer.routes");
const behaviorRoutes = require("./routes/behavior.routes");

const app = express();
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: "Quá nhiều requests, vui lòng thử lại sau",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for behavior tracking endpoints
    return req.path === "/behavior/track" || req.path === "/behavior/track/batch";
  },
});
app.use(helmet());

app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  })
);

if (config.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

app.use(limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "Identity Service",
    timestamp: new Date().toISOString(),
  });
});

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/customers", customerRoutes);
app.use("/behavior", behaviorRoutes);

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDatabase();
    // Redis connection is optional - don't fail if it's unavailable
    try {
      await connectRedis();
    } catch (redisErr) {
      console.warn("⚠️  Redis connection failed, continuing without cache");
    }

    app.listen(config.PORT, () => {
      console.log(`🚀 Identity Service running on port ${config.PORT}`);
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
