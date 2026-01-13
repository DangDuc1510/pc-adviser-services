const express = require("express");
const router = express.Router();
const vnpayController = require("../controllers/vnpay.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

// Get payment by order ID (requires authentication)
router.get("/order/:orderId", verifyToken, vnpayController.getPaymentByOrderId);

module.exports = router;
