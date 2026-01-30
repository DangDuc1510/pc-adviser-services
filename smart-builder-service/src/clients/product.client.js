const axios = require("axios");
const { PRODUCT_SERVICE } = require("../config/services");
const { ExternalServiceError } = require("../errors");
const logger = require("../utils/logger");

class ProductClient {
  constructor() {
    this.baseURL = PRODUCT_SERVICE.BASE_URL;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async getProduct(productId) {
    try {
      logger.debug(
        `Fetching product ${productId} from ${this.baseURL}/products/${productId}`
      );
      const response = await this.client.get(`/products/${productId}`);

      // Handle different response formats
      let product = null;
      if (response.data) {
        // Check if response has error status
        if (response.data.status === "error") {
          // Product Service returns error in body with 200 status sometimes
          if (
            response.data.message &&
            response.data.message.includes("Không tìm thấy")
          ) {
            logger.debug(
              `Product ${productId} not found (error in response body)`
            );
            return null;
          }
          throw new ExternalServiceError(
            response.data.message || "Product service error",
            response.status || 500
          );
        }

        // Product Service returns product directly (not wrapped in data)
        // Check if it's a product object
        if (response.data._id || response.data.id) {
          product = response.data;
        } else if (response.data.data) {
          // Some responses might be wrapped
          product = response.data.data;
        } else {
          product = response.data;
        }
      }

      // Validate product has ID
      if (product && !product._id && !product.id) {
        logger.warn(`Product ${productId} response missing ID field`);
        return null;
      }

      if (product) {
        logger.debug(
          `Successfully fetched product ${productId}: ${
            product.name || "Unknown"
          }`
        );
      }

      return product;
    } catch (error) {
      // Log error for debugging
      logger.error(`ProductClient.getProduct error for ${productId}:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: `${this.baseURL}/products/${productId}`,
      });

      // Handle 404 or not found errors
      if (error.response?.status === 404) {
        return null;
      }

      // Handle error response in body (some services return 200 with error)
      if (error.response?.data?.status === "error") {
        const errorMsg = error.response.data.message || "";
        if (
          errorMsg.includes("Không tìm thấy") ||
          errorMsg.includes("not found")
        ) {
          return null;
        }
      }

      // Handle network errors
      if (!error.response) {
        logger.error(`Network error calling Product Service: ${error.message}`);
        throw new ExternalServiceError(
          `Cannot connect to Product Service: ${error.message}`,
          503
        );
      }

      throw new ExternalServiceError(
        `Failed to fetch product: ${error.message}`,
        error.response?.status || 500
      );
    }
  }

  async getProducts(filters = {}) {
    try {
      const response = await this.client.get("/products", {
        params: filters,
      });
      // Product Service returns products directly or wrapped in data
      if (response.data) {
        if (response.data.products) {
          return response.data.products;
        }
        if (Array.isArray(response.data)) {
          return response.data;
        }
        if (response.data.data) {
          return response.data.data;
        }
      }
      return response.data || [];
    } catch (error) {
      logger.error(`ProductClient.getProducts error:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new ExternalServiceError(
        `Failed to fetch products: ${error.message}`,
        error.response?.status
      );
    }
  }

  /**
   * Get lightweight products (internal API)
   * Returns products without heavy fields (images, fullDescription, videos, etc.)
   * Used for calculations in recommendation system
   */
  async getLightweightProducts(filters = {}) {
    try {
      logger.debug(`[ProductClient] Fetching lightweight products`, { filters });
      const response = await this.client.get("/products/internal/lightweight", {
        params: filters,
      });
      
      // Handle response format
      if (response.data) {
        if (response.data.products) {
          logger.debug(`[ProductClient] Got ${response.data.products.length} lightweight products`);
          return response.data.products;
        }
        if (Array.isArray(response.data)) {
          logger.debug(`[ProductClient] Got ${response.data.length} lightweight products`);
          return response.data;
        }
        if (response.data.data) {
          return response.data.data;
        }
      }
      return response.data || [];
    } catch (error) {
      logger.error(`ProductClient.getLightweightProducts error:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      // Fallback to regular getProducts if lightweight API fails
      logger.warn(`[ProductClient] Falling back to regular getProducts`);
      return this.getProducts(filters);
    }
  }

  /**
   * Get lightweight product by ID (internal API)
   */
  async getLightweightProduct(productId) {
    try {
      logger.debug(`[ProductClient] Fetching lightweight product ${productId}`);
      const response = await this.client.get(`/products/internal/lightweight/${productId}`);
      
      if (response.data) {
        logger.debug(`[ProductClient] Got lightweight product ${productId}`);
        return response.data;
      }
      return null;
    } catch (error) {
      logger.error(`ProductClient.getLightweightProduct error for ${productId}:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      
      if (error.response?.status === 404) {
        return null;
      }
      
      // Fallback to regular getProduct if lightweight API fails
      logger.warn(`[ProductClient] Falling back to regular getProduct`);
      return this.getProduct(productId);
    }
  }

  async getCategory(categoryId) {
    try {
      const response = await this.client.get(`/categories/${categoryId}`);
      return response.data.data || response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new ExternalServiceError(
        `Failed to fetch category: ${error.message}`,
        error.response?.status
      );
    }
  }

  async checkStock(productId, quantity = 1) {
    try {
      const product = await this.getProduct(productId);
      if (!product) {
        return { available: false, reason: "Product not found" };
      }

      const availableStock =
        product.inventory?.stock - (product.inventory?.reservedStock || 0);
      return {
        available: availableStock >= quantity,
        stock: availableStock,
        reason: availableStock >= quantity ? "In stock" : "Insufficient stock",
      };
    } catch (error) {
      throw new ExternalServiceError(
        `Failed to check stock: ${error.message}`,
        error.response?.status
      );
    }
  }
}

module.exports = new ProductClient();
