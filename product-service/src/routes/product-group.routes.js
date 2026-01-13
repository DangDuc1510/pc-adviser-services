const express = require("express");
const router = express.Router();
const productGroupController = require("../controllers/product-group.controller");
const { optionalAuth } = require("../middlewares/auth.middleware");

// Apply optional auth middleware to all routes
router.use(optionalAuth);

// Health check
router.get("/health", (req, res) => {
  res.json({
    message: "Product Service - Product Group Routes is running",
    status: "ok",
  });
});

// Get all product groups with pagination and filters
router.get("/", productGroupController.getAll);

// Get public product groups
router.get("/public", productGroupController.getPublic);

// Get product groups by user
router.get("/user/:userId", productGroupController.getByUser);
router.get("/user", productGroupController.getByUser);

// Get product group by ID - MUST be before other /:id routes
router.get("/:id", productGroupController.getById);

// Create new product group
router.post("/", productGroupController.create);

// Update product group
router.put("/:id", productGroupController.update);

// Delete product group
router.delete("/:id", productGroupController.delete);

// Toggle product group status
router.patch("/:id/toggle-status", productGroupController.toggleStatus);

// Add product to group
router.post("/:id/products", productGroupController.addProduct);

// Remove product from group
router.delete("/:id/products/:productId", productGroupController.removeProduct);

// Update product quantity in group
router.patch("/:id/products", productGroupController.updateProductQuantity);

module.exports = router;
