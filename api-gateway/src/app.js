require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT;

const corsOrigins = process.env.CORS_ORIGIN.split(",")
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-access-token"],
  })
);

app.use(
  rateLimit({
    windowMs: process.env.API_RATE_LIMIT_WINDOW_MS,
    max: process.env.API_RATE_LIMIT_MAX_REQUESTS,
    message: "Too many requests from this IP, please try again later.",
    validate: false,
    skip: (req) => {
      // Skip rate limiting for behavior tracking endpoints
      return req.path === "/behavior/track" || req.path === "/behavior/track/batch";
    },
  })
);

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "API Gateway",
  });
});

const services = {
  identity: process.env.IDENTITY_SERVICE_URL,
  product: process.env.PRODUCT_SERVICE_URL,
  order: process.env.ORDER_SERVICE_URL,
  smartBuilder: process.env.SMART_BUILDER_SERVICE_URL,
  search: process.env.SEARCH_SERVICE_URL,
  system: process.env.SYSTEM_SERVICE_URL,
  voucher: process.env.VOUCHER_SERVICE_URL,
};

const createProxy = (target, routeName, options = {}) => {
  const {
    enableLogging = false,
    onProxyReq: customOnProxyReq,
    onProxyRes: customOnProxyRes,
  } = options;

  return createProxyMiddleware({
    target,
    changeOrigin: true,
    onError: (err, req, res) => {
      console.error(`Proxy error for ${routeName}:`, err.message);
      res.status(503).json({
        error: "Service unavailable",
        message: `Cannot connect to service`,
        timestamp: new Date().toISOString(),
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      if (enableLogging) {
        console.log(
          `→ Proxying ${req.method} ${req.url} to ${target}${req.url}`
        );
      }
      if (customOnProxyReq) {
        customOnProxyReq(proxyReq, req, res);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      if (enableLogging) {
        console.log(`← Response from ${target}: ${proxyRes.statusCode}`);
        console.log("-".repeat(50));
      }
      if (customOnProxyRes) {
        customOnProxyRes(proxyRes, req, res);
      }
    },
    secure: false,
    logLevel: "silent",
  });
};

const setupRoutes = (routes, target, options = {}) => {
  routes.forEach((route) => {
    app.use(route, createProxy(target, route, options));
  });
};

const setupHealthRoutes = () => {
  const healthRoutes = [
    { path: "identity", service: services.identity },
    { path: "order-service", service: services.order },
    { path: "product-service", service: services.product },
    { path: "smart-builder-service", service: services.smartBuilder },
    { path: "voucher-service", service: services.voucher },
    { path: "search-service", service: services.search },
    { path: "system-service", service: services.system },
  ];

  healthRoutes.forEach(({ path, service }) => {
    app.use(
      `/health/${path}`,
      createProxy(service, `/health/${path}`, {
        pathRewrite: { [`^/health/${path}`]: "/health" },
      })
    );
  });
};

setupHealthRoutes();

setupRoutes(
  ["/auth", "/user", "/customers", "/behavior"],
  services.identity,
  { enableLogging: true }
);

setupRoutes(
  ["/products", "/categories", "/brands", "/product-groups"],
  services.product,
  { enableLogging: true }
);

setupRoutes(
  ["/orders", "/cart", "/payment"],
  services.order,
  { enableLogging: true }
);

setupRoutes(["/search"], services.search, { enableLogging: true });
setupRoutes(["/statistics"], services.system, { enableLogging: true });
setupRoutes(["/recommendations", "/segmentation"], services.smartBuilder, { enableLogging: true });
setupRoutes(
  ["/voucher-rules", "/voucher-distributions", "/voucher-triggers", "/promo-codes", "/internal"],
  services.voucher,
  { enableLogging: true }
);
app.listen(PORT, () => {
  console.log("🚀 PC Adviser API Gateway started successfully!");
  console.log("=".repeat(50));
});

module.exports = app;
