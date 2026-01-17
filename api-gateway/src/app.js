require("dotenv").config();

const express = require("express");
const rateLimit = require("express-rate-limit");
const { createProxyMiddleware } = require("http-proxy-middleware");
// const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - required when running behind a reverse proxy (like Render)
// Set to 1 to trust only the first proxy hop (Render's load balancer)
// This allows Express to read X-Forwarded-For header correctly
// app.set("trust proxy", 1);

app.use(
  rateLimit({
    windowMs: process.env.API_RATE_LIMIT_WINDOW_MS || 60 * 1000,
    max: process.env.API_RATE_LIMIT_MAX_REQUESTS || 100,
    message: "Too many requests from this IP, please try again later.",
    // Disable validation warning since we're explicitly trusting only 1 proxy hop
    validate: false,
  })
);

// app.use(
//   cors({
//     origin: process.env.CORS_ORIGIN?.split(",") || [
//       "https://pc-adviser-web.vercel.app",
//       "https://pc-adviser-cms.vercel.app",
//       "http://localhost:4000",
//       "http://localhost:4001",
//     ],
//     credentials: true,
//     exposedHeaders: ["ngrok-skip-browser-warning"],
//     allowedHeaders: [
//       "Content-Type",
//       "Authorization",
//       "ngrok-skip-browser-warning",
//     ],
//   })
// );

// Middleware to bypass ngrok warning page
// Note: This header needs to be in the REQUEST from client, not response
// But we add it here as a fallback and also set CORS to allow this header
app.use((req, res, next) => {
  // Add header to response (helps with some cases)
  res.setHeader("ngrok-skip-browser-warning", "true");

  // If request already has the header, forward it
  if (req.headers["ngrok-skip-browser-warning"]) {
    res.setHeader(
      "ngrok-skip-browser-warning",
      req.headers["ngrok-skip-browser-warning"]
    );
  }

  next();
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "API Gateway",
  });
});

// Helper function to normalize service URLs (add https:// if missing)
const normalizeServiceUrl = (url, defaultUrl) => {
  const serviceUrl = url || defaultUrl;
  if (!serviceUrl) return defaultUrl;
  // If URL already has protocol, return as is
  if (serviceUrl.startsWith("http://") || serviceUrl.startsWith("https://")) {
    return serviceUrl;
  }
  // Otherwise, add https:// prefix (for Render hostnames)
  return `https://${serviceUrl}`;
};

const services = {
  identity: normalizeServiceUrl(
    process.env.IDENTITY_SERVICE_URL,
    "http://localhost:3001"
  ),
  product: normalizeServiceUrl(
    process.env.PRODUCT_SERVICE_URL,
    "http://localhost:3002"
  ),
  order: normalizeServiceUrl(
    process.env.ORDER_SERVICE_URL,
    "http://localhost:3003"
  ),
  smartBuilder: normalizeServiceUrl(
    process.env.SMART_BUILDER_SERVICE_URL,
    "http://localhost:3004"
  ),
  search: normalizeServiceUrl(
    process.env.SEARCH_SERVICE_URL,
    "http://localhost:3006"
  ),
  system: normalizeServiceUrl(
    process.env.SYSTEM_SERVICE_URL,
    "http://localhost:3007"
  ),
  voucher: normalizeServiceUrl(
    process.env.VOUCHER_SERVICE_URL,
    "http://localhost:3008"
  ),
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
      // Bypass ngrok warning page
      proxyReq.setHeader("ngrok-skip-browser-warning", "true");

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
      // Add header to response to bypass ngrok warning page
      proxyRes.headers["ngrok-skip-browser-warning"] = "true";

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
setupRoutes(["/auth", "/user", "/customers", "/behavior"], services.identity, {
  enableLogging: true,
});

setupRoutes(
  ["/products", "/categories", "/brands", "/product-groups"],
  services.product
);

setupRoutes(["/orders", "/cart", "/payment"], services.order, {
  enableLogging: true,
});

setupRoutes(
  [
    "/voucher-rules",
    "/voucher-distributions",
    "/voucher-triggers",
    "/promo-codes",
  ],
  services.voucher,
  { enableLogging: true }
);

setupRoutes(["/recommendations", "/segmentation"], services.smartBuilder, {
  enableLogging: true,
});

setupRoutes(["/search"], services.search, { enableLogging: true });

setupRoutes(["/statistics"], services.system, { enableLogging: true });

app.listen(PORT, () => {
  console.log("🚀 PC Adviser API Gateway started successfully!");
  console.log("=".repeat(50));
});

module.exports = app;
