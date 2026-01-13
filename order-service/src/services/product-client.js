const axios = require("axios");
const config = require("../config/env");
const { ProductServiceError } = require("../errors");

class ProductClient {
  constructor() {
    this.baseURL = config.PRODUCT_SERVICE_URL;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error("Product Service Error:", error.message);
        if (error.response) {
          throw new ProductServiceError(
            error.response.data?.message || "Lỗi kết nối với Product Service"
          );
        }
        throw new ProductServiceError("Không thể kết nối với Product Service");
      }
    );
  }

  // Get product by ID
  async getProductById(productId) {
    try {
      const response = await this.client.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error.message);
      throw error;
    }
  }

  // Get multiple products by IDs
  async getProductsByIds(productIds) {
    try {
      const promises = productIds.map((id) => this.getProductById(id));
      return await Promise.all(promises);
    } catch (error) {
      console.error("Error fetching multiple products:", error.message);
      throw error;
    }
  }

  // Check if product has sufficient stock
  async checkStock(productId, quantity) {
    try {
      const product = await this.getProductById(productId);

      if (!product.inventory) {
        return { available: false, reason: "Thông tin tồn kho không có sẵn" };
      }

      const availableStock =
        product.inventory.stock - (product.inventory.reservedStock || 0);

      if (!product.inventory.isInStock || availableStock <= 0) {
        return { available: false, reason: "Sản phẩm hết hàng" };
      }

      if (availableStock < quantity) {
        return {
          available: false,
          reason: `Chỉ còn ${availableStock} sản phẩm trong kho`,
          availableQuantity: availableStock,
        };
      }

      return {
        available: true,
        availableQuantity: availableStock,
        product,
      };
    } catch (error) {
      console.error(
        `Error checking stock for product ${productId}:`,
        error.message
      );
      throw error;
    }
  }

  // Reserve stock when creating order
  async reserveStock(productId, quantity) {
    try {
      const response = await this.client.patch(
        `/products/${productId}/reserve-stock`,
        {
          quantity,
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error reserving stock for product ${productId}:`,
        error.message
      );
      throw error;
    }
  }

  // Update stock when payment is successful
  async updateStock(productId, quantity) {
    try {
      const response = await this.client.patch(`/products/${productId}/stock`, {
        stock: quantity,
        operation: "decrease", // decrease stock
      });
      return response.data;
    } catch (error) {
      console.error(
        `Error updating stock for product ${productId}:`,
        error.message
      );
      throw error;
    }
  }

  // Release reserved stock when order is cancelled
  async releaseStock(productId, quantity) {
    try {
      const response = await this.client.patch(
        `/products/${productId}/release-stock`,
        {
          quantity,
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error releasing stock for product ${productId}:`,
        error.message
      );
      throw error;
    }
  }

  // Deduct stock from reserved (when payment is successful)
  async deductStock(productId, quantity) {
    try {
      const response = await this.client.patch(
        `/products/${productId}/deduct-stock`,
        {
          quantity,
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error deducting stock for product ${productId}:`,
        error.message
      );
      throw error;
    }
  }

  // Batch reserve stock for multiple products
  async batchReserveStock(items) {
    try {
      const promises = items.map((item) =>
        this.reserveStock(item.productId, item.quantity)
      );
      return await Promise.all(promises);
    } catch (error) {
      console.error("Error batch reserving stock:", error.message);
      throw error;
    }
  }

  // Batch release stock for multiple products
  async batchReleaseStock(items) {
    try {
      const promises = items.map((item) =>
        this.releaseStock(item.productId, item.quantity)
      );
      return await Promise.all(promises);
    } catch (error) {
      console.error("Error batch releasing stock:", error.message);
      throw error;
    }
  }

  // Batch update stock for multiple products
  async batchUpdateStock(items) {
    try {
      const promises = items.map((item) =>
        this.updateStock(item.productId, item.quantity)
      );
      return await Promise.all(promises);
    } catch (error) {
      console.error("Error batch updating stock:", error.message);
      throw error;
    }
  }

  // Get brand by ID
  async getBrandById(brandId) {
    try {
      const response = await this.client.get(`/brands/${brandId}`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Error fetching brand ${brandId}:`, error.message);
      throw error;
    }
  }

  // Get multiple brands by IDs
  async getBrandsByIds(brandIds) {
    try {
      const promises = brandIds.map((id) => this.getBrandById(id));
      return await Promise.all(promises);
    } catch (error) {
      console.error("Error fetching multiple brands:", error.message);
      throw error;
    }
  }

  // Get category by ID
  async getCategoryById(categoryId) {
    try {
      const response = await this.client.get(`/categories/${categoryId}`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Error fetching category ${categoryId}:`, error.message);
      throw error;
    }
  }

  // Get multiple categories by IDs
  async getCategoriesByIds(categoryIds) {
    try {
      const promises = categoryIds.map((id) => this.getCategoryById(id));
      return await Promise.all(promises);
    } catch (error) {
      console.error("Error fetching multiple categories:", error.message);
      throw error;
    }
  }
}

module.exports = new ProductClient();
