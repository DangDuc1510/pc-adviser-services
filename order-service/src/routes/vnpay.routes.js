const express = require("express");
const router = express.Router();
const vnpayController = require("../controllers/vnpay.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { isAdmin } = require("../middlewares/permission.middleware");

// Create payment URL (requires authentication)
router.post(
  "/orders/:orderId/payment-url",
  verifyToken,
  vnpayController.createPaymentUrl
);

// VNPay return URL (public - called by VNPay)
router.get("/return", vnpayController.handleReturn);

// VNPay IPN (public - called by VNPay)
router.get("/ipn", vnpayController.handleIPN);

// Query transaction (requires authentication)
router.post("/query", verifyToken, vnpayController.queryTransaction);

// Refund transaction (requires admin)
router.post(
  "/orders/:orderId/refund",
  verifyToken,
  isAdmin,
  vnpayController.refundTransaction
);

module.exports = router;
