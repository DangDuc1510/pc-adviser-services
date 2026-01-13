const express = require("express");
const router = express.Router();
const behaviorCtrl = require("../controllers/behavior.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

// Health check
router.get("/health", (req, res) => {
  res.json({
    message: "Identity Service - Behavior Routes is running",
    status: "ok",
  });
});

// Public routes - Track events (no auth required)
router.post("/track", behaviorCtrl.trackEvent);
router.post("/track/batch", behaviorCtrl.trackEvents);

// Get behavior events for user (by userId) - allow authenticated users to view their own data
router.get("/user/:userId", authenticate, behaviorCtrl.getUserBehavior);

// Internal routes - no authentication required (for service-to-service communication)
router.get("/internal/:customerId", behaviorCtrl.getCustomerBehaviorInternal);
router.get("/internal/user/:userId", behaviorCtrl.getUserBehaviorInternal);
router.get(
  "/internal/user/:userId/summary",
  behaviorCtrl.getUserBehaviorSummaryInternal
);
router.get(
  "/internal/user/:userId/timeline",
  behaviorCtrl.getUserBehaviorTimelineInternal
);

// Admin/Manager/Sales routes - require authentication
router.get(
  "/:customerId",
  authenticate,
  authorize(["admin", "employee"]),
  behaviorCtrl.getCustomerBehavior
);

router.get(
  "/:customerId/summary",
  authenticate,
  authorize(["admin", "employee"]),
  behaviorCtrl.getBehaviorSummary
);

router.get(
  "/:customerId/timeline",
  authenticate,
  authorize(["admin", "employee"]),
  behaviorCtrl.getBehaviorTimeline
);

// Analytics routes
router.get(
  "/analytics/products/:productId",
  authenticate,
  authorize(["admin", "employee"]),
  behaviorCtrl.getProductAnalytics
);

router.get(
  "/analytics/overview",
  authenticate,
  authorize(["admin", "employee"]),
  behaviorCtrl.getOverviewAnalytics
);

module.exports = router;
