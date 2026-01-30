const productService = require("../services/product.service");
const cloudinaryUtils = require("../utils/cloudinary");
const Product = require("../models/product.model");

// Get all products with filters and pagination
const getAll = async (req, res, next) => {
  try {
    const result = await productService.getAllProducts(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Get product by ID
const getById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// Get product by slug
const getBySlug = async (req, res, next) => {
  try {
    const product = await productService.getProductBySlug(req.params.slug);
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// Get lightweight products (internal API for smart-builder-service)
// Returns products without images, fullDescription, videos, etc.
const getLightweight = async (req, res, next) => {
  try {
    const result = await productService.getLightweightProducts(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Get lightweight product by ID (internal API)
const getLightweightById = async (req, res, next) => {
  try {
    const product = await productService.getLightweightProductById(req.params.id);
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// Get featured products
const getFeatured = async (req, res, next) => {
  try {
    const products = await productService.getFeaturedProducts(req.query);
    res.json(products);
  } catch (error) {
    next(error);
  }
};

// Get products on sale
const getOnSale = async (req, res, next) => {
  try {
    const result = await productService.getOnSaleProducts(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Search products
const search = async (req, res, next) => {
  try {
    const products = await productService.searchProducts(req.query);
    res.json(products);
  } catch (error) {
    next(error);
  }
};

// Create new product
const create = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

// Update product
const update = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// Update product stock
const updateStock = async (req, res, next) => {
  try {
    const product = await productService.updateProductStock(
      req.params.id,
      req.body
    );
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// Toggle product status (active/inactive)
const toggleStatus = async (req, res, next) => {
  try {
    const product = await productService.toggleProductStatus(req.params.id);
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// Toggle featured status
const toggleFeatured = async (req, res, next) => {
  try {
    const product = await productService.toggleFeaturedStatus(req.params.id);
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// Delete product
const deleteProduct = async (req, res, next) => {
  try {
    const result = await productService.deleteProduct(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Bulk update status
const bulkUpdateStatus = async (req, res, next) => {
  try {
    const { productIds, isActive } = req.body;
    const result = await productService.bulkUpdateStatus(productIds, isActive);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Bulk delete
const bulkDelete = async (req, res, next) => {
  try {
    const { productIds } = req.body;
    const result = await productService.bulkDelete(productIds);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Get related products
const getRelated = async (req, res, next) => {
  try {
    const { limit = 8 } = req.query;
    const products = await productService.getRelatedProducts(
      req.params.id,
      limit
    );
    res.json(products);
  } catch (error) {
    next(error);
  }
};

// Get low stock products
const getLowStock = async (req, res, next) => {
  try {
    const { threshold = 10 } = req.query;
    const products = await productService.getLowStockProducts(threshold);
    res.json(products);
  } catch (error) {
    next(error);
  }
};

// Get out of stock products
const getOutOfStock = async (req, res, next) => {
  try {
    const products = await productService.getOutOfStockProducts();
    res.json(products);
  } catch (error) {
    next(error);
  }
};

// Get products by price range
const getByPriceRange = async (req, res, next) => {
  try {
    const { minPrice, maxPrice } = req.query;
    const products = await productService.getProductsByPriceRange(
      minPrice,
      maxPrice,
      req.query
    );
    res.json(products);
  } catch (error) {
    next(error);
  }
};

// Upload product images
const uploadImages = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Không có file ảnh được tải lên",
      });
    }

    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy sản phẩm",
      });
    }

    // Upload images to Cloudinary
    const uploadPromises = req.files.map(async (file, index) => {
      return await cloudinaryUtils.uploadProductImage(file.buffer, id, {
        isPrimary: index === 0 && product.images.length === 0, // First image is primary if no images exist
        sortOrder: product.images.length + index,
      });
    });

    const uploadResults = await Promise.all(uploadPromises);

    // Add images to product
    const newImages = uploadResults.map((result) => ({
      url: result.url,
      alt: result.alt || product.name,
      isPrimary: result.isPrimary,
      sortOrder: result.sortOrder,
    }));

    product.images.push(...newImages);
    await product.save();

    res.json({
      status: "success",
      message: "Upload ảnh sản phẩm thành công",
      data: {
        images: uploadResults,
        product: product,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Upload single product image
const uploadSingleImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "Không có file ảnh được tải lên",
      });
    }

    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy sản phẩm",
      });
    }

    // Upload image to Cloudinary
    const uploadResult = await cloudinaryUtils.uploadProductImage(
      req.file.buffer,
      id,
      {
        isPrimary: req.body.isPrimary === "true" || product.images.length === 0,
        alt: req.body.alt || product.name,
        sortOrder: parseInt(req.body.sortOrder) || product.images.length,
      }
    );

    // Add image to product
    const newImage = {
      url: uploadResult.url,
      alt: uploadResult.alt,
      isPrimary: uploadResult.isPrimary,
      sortOrder: uploadResult.sortOrder,
    };

    // If this image is set as primary, remove primary from others
    if (uploadResult.isPrimary) {
      product.images.forEach((img) => (img.isPrimary = false));
    }

    product.images.push(newImage);
    await product.save();

    res.json({
      status: "success",
      message: "Upload ảnh sản phẩm thành công",
      data: {
        image: uploadResult,
        product: product,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete product image
const deleteImage = async (req, res, next) => {
  try {
    const { id, imageIndex } = req.params;
    const imageIndexInt = parseInt(imageIndex);

    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy sản phẩm",
      });
    }

    // Check if image index is valid
    if (imageIndexInt < 0 || imageIndexInt >= product.images.length) {
      return res.status(400).json({
        status: "error",
        message: "Index ảnh không hợp lệ",
      });
    }

    const imageToDelete = product.images[imageIndexInt];

    // Extract public ID from Cloudinary URL
    const urlParts = imageToDelete.url.split("/");
    const publicIdWithExtension = urlParts.slice(-2).join("/");
    const publicId = publicIdWithExtension.split(".")[0];

    try {
      // Delete from Cloudinary
      await cloudinaryUtils.deleteImage(publicId);
    } catch (cloudinaryError) {
      console.error("Cloudinary delete error:", cloudinaryError);
      // Continue with database deletion even if Cloudinary deletion fails
    }

    // Remove image from product
    product.images.splice(imageIndexInt, 1);

    // If deleted image was primary and there are other images, set first image as primary
    if (imageToDelete.isPrimary && product.images.length > 0) {
      product.images[0].isPrimary = true;
    }

    await product.save();

    res.json({
      status: "success",
      message: "Xóa ảnh sản phẩm thành công",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Set primary image
const setPrimaryImage = async (req, res, next) => {
  try {
    const { id, imageIndex } = req.params;
    const imageIndexInt = parseInt(imageIndex);

    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy sản phẩm",
      });
    }

    // Check if image index is valid
    if (imageIndexInt < 0 || imageIndexInt >= product.images.length) {
      return res.status(400).json({
        status: "error",
        message: "Index ảnh không hợp lệ",
      });
    }

    // Remove primary from all images
    product.images.forEach((img) => (img.isPrimary = false));

    // Set new primary image
    product.images[imageIndexInt].isPrimary = true;

    await product.save();

    res.json({
      status: "success",
      message: "Đặt ảnh chính thành công",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Reserve stock for order
const reserveStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        status: "error",
        message: "Số lượng không hợp lệ",
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy sản phẩm",
      });
    }

    // Check if enough stock available
    const availableStock =
      product.inventory.stock - (product.inventory.reservedStock || 0);
    if (availableStock < quantity) {
      return res.status(409).json({
        status: "error",
        message: "Không đủ hàng trong kho",
        availableStock,
      });
    }

    // Reserve stock
    product.inventory.reservedStock =
      (product.inventory.reservedStock || 0) + quantity;
    await product.save();

    res.json({
      status: "success",
      message: "Đã đặt trước hàng thành công",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Release reserved stock (when order is cancelled)
const releaseStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        status: "error",
        message: "Số lượng không hợp lệ",
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy sản phẩm",
      });
    }

    // Release reserved stock
    product.inventory.reservedStock = Math.max(
      0,
      (product.inventory.reservedStock || 0) - quantity
    );
    await product.save();

    res.json({
      status: "success",
      message: "Đã hoàn trả hàng đặt trước",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Deduct stock from reserved (when payment is successful)
// Internal API - no auth required
const deductStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        status: "error",
        message: "Số lượng không hợp lệ",
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy sản phẩm",
      });
    }

    // Check if enough reserved stock
    const reservedStock = product.inventory.reservedStock || 0;
    if (reservedStock < quantity) {
      return res.status(409).json({
        status: "error",
        message: "Không đủ hàng đã đặt trước để trừ",
        reservedStock,
      });
    }

    // Deduct from both reservedStock and total stock
    product.inventory.reservedStock = Math.max(0, reservedStock - quantity);
    product.inventory.stock = Math.max(
      0,
      (product.inventory.stock || 0) - quantity
    );
    product.inventory.isInStock = product.inventory.stock > 0;

    await product.save();

    res.json({
      status: "success",
      message: "Đã trừ hàng thành công",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Get price range (min/max) for filtering
const getPriceRange = async (req, res, next) => {
  try {
    const priceRange = await productService.getPriceRange(req.query);
    res.json({
      success: true,
      data: priceRange,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  getBySlug,
  getFeatured,
  getOnSale,
  search,
  getLightweight,
  getLightweightById,
  create,
  update,
  updateStock,
  reserveStock,
  releaseStock,
  deductStock,
  toggleStatus,
  toggleFeatured,
  delete: deleteProduct,
  bulkUpdateStatus,
  bulkDelete,
  getRelated,
  getLowStock,
  getOutOfStock,
  getByPriceRange,
  uploadImages,
  uploadSingleImage,
  deleteImage,
  setPrimaryImage,
  getPriceRange,
};
