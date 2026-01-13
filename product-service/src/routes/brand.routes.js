const express = require("express");
const router = express.Router();
const brandController = require("../controllers/brand.controller");
const { handleBrandLogoUpload } = require("../middlewares/upload.middleware");

// health check
router.get("/health", (req, res) => {
  res.json({
    message: "Product Service - Brand Routes is running",
    status: "ok",
  });
});

// Get all brands with pagination and filters
router.get("/", brandController.getAll);

// Get brands with product count
router.get("/with-products", brandController.getWithProductCount);

// Get popular brands
router.get("/popular", brandController.getPopularBrands);

// Get active brands
router.get("/active", brandController.getActiveBrands);

// Get brands grouped by country
router.get("/grouped-by-country", brandController.getBrandsGroupedByCountry);

// Search brands
router.get("/search", brandController.search);

// Get brand by ID
router.get("/:id", brandController.getById);

// Get brand by slug
router.get("/slug/:slug", brandController.getBySlug);

// Get brands by country
router.get("/country/:country", brandController.getByCountry);

// Get brands by category
router.get("/category/:categoryId", brandController.getByCategory);

// Get brand statistics
router.get("/:id/stats", brandController.getStats);

// Create new brand
router.post("/", brandController.create);

// Update brand
router.put("/:id", brandController.update);

// Logo upload routes
router.post(
  "/:id/upload-logo",
  handleBrandLogoUpload,
  brandController.uploadLogo
);
router.delete("/:id/delete-logo", brandController.deleteLogo);

// Toggle brand status
router.patch("/:id/toggle-status", brandController.toggleStatus);

// Bulk update brand status
router.post("/bulk/update-status", brandController.bulkUpdateStatus);

// Delete brand
router.delete("/:id", brandController.delete);

module.exports = router;
