const express = require("express");
const router = express.Router();
const segmentationController = require("../controllers/segmentation.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

// Get segmentation statistics (must be before /analyze/:customerId)
router.get(
  "/stats",
  authenticate,
  authorize(["admin"]),
  segmentationController.getSegmentationStats
);

// Analyze all customers (no limit, sorted by updatedAt)
router.post(
  "/analyze/all",
  authenticate,
  authorize(["admin"]),
  segmentationController.analyzeAllCustomers
);

// Analyze multiple customers (batch) - must be before /analyze/:customerId
router.post(
  "/analyze/batch",
  authenticate,
  authorize(["admin"]),
  segmentationController.analyzeCustomers
);

// Analyze single customer (GET to retrieve, POST to force update)
router.get(
  "/analyze/:customerId",
  authenticate,
  authorize(["admin"]),
  segmentationController.analyzeCustomer
);
router.post(
  "/analyze/:customerId",
  authenticate,
  authorize(["admin"]),
  segmentationController.analyzeCustomer
);

// Get customers by segmentation type
router.get(
  "/customers/:type",
  authenticate,
  authorize(["admin"]),
  segmentationController.getCustomersBySegment
);

module.exports = router;
