const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const config = require("./config/env");
const { connectDatabase } = require("./config/database");
const { errorHandler } = require("./errors");

// Import models to ensure they are registered before use
require("./models/user.model");
require("./models/product.model");
require("./models/category.model");
require("./models/brand.model");
require("./models/product-group.model");

const productRoutes = require("./routes/product.routes");
const categoryRoutes = require("./routes/category.routes");
const brandRoutes = require("./routes/brand.routes");
const productGroupRoutes = require("./routes/product-group.routes");

const app = express();

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

app.use(express.json({ limit: config.MAX_FILE_SIZE }));
app.use(express.urlencoded({ extended: true, limit: config.MAX_FILE_SIZE }));

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "Product Service",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.use("/products", productRoutes);
app.use("/categories", categoryRoutes);
app.use("/brands", brandRoutes);
app.use("/product-groups", productGroupRoutes);

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(config.PORT, () => {
      console.log(`🚀 Product Service running on port ${config.PORT}`);
      console.log(`📊 Environment: ${config.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${config.PORT}/health`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
