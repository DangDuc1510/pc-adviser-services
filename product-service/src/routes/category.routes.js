const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");
const {
  handleCategoryImageUpload,
} = require("../middlewares/upload.middleware");

// health check
router.get("/health", (req, res) => {
  res.json({
    message: "Product Service - Category Routes is running",
    status: "ok",
  });
});

// Get all categories with pagination and filters
router.get("/", categoryController.getAll);

// Get hierarchical category tree
router.get("/hierarchy", categoryController.getHierarchy);

// Get categories with product count
router.get("/with-products", categoryController.getWithProductCount);

// Get root categories
router.get("/root", categoryController.getRootCategories);

// Get categories by component type
router.get("/component/:componentType", categoryController.getByComponentType);

// Search categories
router.get("/search", categoryController.search);

// Get category by ID
router.get("/:id", categoryController.getById);

// Get category by slug
router.get("/slug/:slug", categoryController.getBySlug);

// Get child categories
router.get("/:parentId/children", categoryController.getChildCategories);

// Get category path (breadcrumb)
router.get("/:id/path", categoryController.getCategoryPath);

// Get category statistics
router.get("/:id/stats", categoryController.getStats);

// Create new category
router.post("/", categoryController.create);

// Update category
router.put("/:id", categoryController.update);

// Image upload routes
router.post(
  "/:id/upload-image",
  handleCategoryImageUpload,
  categoryController.uploadImage
);
router.delete("/:id/delete-image", categoryController.deleteImage);

// Update category sort order
router.patch("/:id/sort-order", categoryController.updateSortOrder);

// Toggle category status
router.patch("/:id/toggle-status", categoryController.toggleStatus);

// Delete category
router.delete("/:id", categoryController.delete);

module.exports = router;
