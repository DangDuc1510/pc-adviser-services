const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const productOptionsController = require("../controllers/product.options.controller");
const productGroupRoutes = require("./product-group.routes");
const {
  handleProductImagesUpload,
  handleSingleProductImageUpload,
} = require("../middlewares/upload.middleware");

// health check
router.get("/health", (req, res) => {
  res.json({
    message: "Product Service - Product Routes is running",
    status: "ok",
  });
});

// Get all products with pagination, search, and filters
router.get("/", productController.getAll);

// Get featured products
router.get("/featured", productController.getFeatured);

// Get products on sale
router.get("/sale", productController.getOnSale);

// Search products
router.get("/search", productController.search);

// Get low stock products
router.get("/low-stock", productController.getLowStock);

// Get out of stock products
router.get("/out-of-stock", productController.getOutOfStock);

// Get products by price range
router.get("/price-range", productController.getByPriceRange);

// Get price range (min/max) for filtering
router.get("/price-range/limits", productController.getPriceRange);

// Get filter options - MUST be before /:id route
router.get("/options/use-cases", productOptionsController.getUseCases);
router.get("/options/colors", productOptionsController.getColors);
router.get("/options/status", productOptionsController.getStatus);
router.get("/options/price-ranges", productOptionsController.getPriceRanges);
router.get("/filter-options", productOptionsController.getAllFilterOptions);
router.get("/filters/:categoryId", productOptionsController.getCategoryFilters);

// Product groups routes - MUST be before /:id route
router.use("/product-groups", productGroupRoutes);

// Get product by slug - MUST be before /:id route
router.get("/slug/:slug", productController.getBySlug);

// Get product by ID - This should be LAST to avoid conflicts
router.get("/:id", productController.getById);

// Get related products
router.get("/:id/related", productController.getRelated);

// Create new product
router.post("/", productController.create);

// Update product
router.put("/:id", productController.update);

// Image upload routes
router.post(
  "/:id/upload-images",
  handleProductImagesUpload,
  productController.uploadImages
);
router.post(
  "/:id/upload-image",
  handleSingleProductImageUpload,
  productController.uploadSingleImage
);
router.delete("/:id/images/:imageIndex", productController.deleteImage);
router.patch(
  "/:id/images/:imageIndex/primary",
  productController.setPrimaryImage
);

// Update product stock
router.patch("/:id/stock", productController.updateStock);

// Reserve stock (for order creation)
router.patch("/:id/reserve-stock", productController.reserveStock);

// Release stock (for order cancellation)
router.patch("/:id/release-stock", productController.releaseStock);

// Deduct stock from reserved (internal API - no auth)
router.patch("/:id/deduct-stock", productController.deductStock);

// Toggle product active status
router.patch("/:id/toggle-status", productController.toggleStatus);

// Toggle product featured status
router.patch("/:id/toggle-featured", productController.toggleFeatured);

// Delete product
router.delete("/:id", productController.delete);

// Bulk operations
router.post("/bulk/update-status", productController.bulkUpdateStatus);
router.post("/bulk/delete", productController.bulkDelete);

module.exports = router;
