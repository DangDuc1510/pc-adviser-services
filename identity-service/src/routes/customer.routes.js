const express = require("express");
const router = express.Router();
const customerCtrl = require("../controllers/customer.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

// Health check
router.get("/health", (req, res) => {
  res.json({
    message: "Identity Service - Customer Routes is running",
    status: "ok",
  });
});

// Admin/Manager/Sales routes - require authentication
router.get(
  "/",
  authenticate,
  authorize(["admin", "employee"]),
  customerCtrl.getAllCustomers
);

router.get(
  "/stats",
  authenticate,
  authorize(["admin", "employee"]),
  customerCtrl.getCustomerStats
);

// Internal routes - Update customer stats (for service-to-service communication)
// No authentication required - only accessible from internal network
// IMPORTANT: These routes must be defined BEFORE /:id route to avoid route conflicts
router.get("/internal/ids", customerCtrl.getAllCustomerIdsInternal);

router.get(
  "/internal/segmentation/stats",
  customerCtrl.getSegmentationStatsInternal
);

router.patch(
  "/internal/:userId/stats",
  customerCtrl.updateCustomerStatsInternal
);

router.get("/internal/:id", customerCtrl.getCustomerByIdInternal);

router.get("/internal/user/:userId", customerCtrl.getCustomerInfoByUserIdInternal);

router.post("/internal/users/batch", customerCtrl.getCustomersByUserIdsBatch);

router.get(
  "/internal/segmentation/:type/users",
  customerCtrl.getUsersBySegmentationTypeInternal
);

router.patch(
  "/internal/:id/segmentation",
  customerCtrl.updateCustomerSegmentationInternal
);

router.get(
  "/:id",
  authenticate,
  authorize(["admin", "employee"]),
  customerCtrl.getCustomerById
);

router.put(
  "/:id",
  authenticate,
  authorize(["admin", "employee"]),
  customerCtrl.updateCustomer
);

router.get(
  "/:id/behavior",
  authenticate,
  authorize(["admin", "employee"]),
  customerCtrl.getCustomerBehavior
);

router.get(
  "/:id/orders",
  authenticate,
  authorize(["admin", "employee"]),
  customerCtrl.getCustomerOrders
);

module.exports = router;
