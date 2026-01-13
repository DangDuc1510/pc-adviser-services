const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { checkPermission } = require("../middlewares/permission.middleware");

// All order routes require authentication
router.post("/checkout", verifyToken, orderController.checkout);
router.post("/", verifyToken, orderController.createOrder);
router.get(
  "/stats",
  verifyToken,
  checkPermission("view_analytics_orders"),
  orderController.getStats
);
router.get("/", verifyToken, orderController.getOrders);
router.patch(
  "/:orderId/status",
  verifyToken,
  checkPermission("manage_order_status"),
  orderController.updateOrderStatus
);
router.patch(
  "/:orderId",
  verifyToken,
  checkPermission("edit_orders"),
  orderController.updateOrder
);
router.get("/:orderId", verifyToken, orderController.getOrderById);

// Internal routes - no authentication required (for service-to-service communication)
router.get("/internal/user/:userId", orderController.getOrdersByUserIdInternal);

module.exports = router;
