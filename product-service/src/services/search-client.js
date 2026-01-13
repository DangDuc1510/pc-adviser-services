const axios = require("axios");
const config = require("../config/env");

class SearchClient {
  constructor() {
    this.baseURL = config.SEARCH_SERVICE_URL;
    this.enabled = config.SEARCH_SERVICE_ENABLED !== "false";

    if (!this.enabled) {
      console.log("Search Service integration is disabled");
      return;
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 5000, // 5 seconds timeout
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Log error but don't throw - we don't want to break product operations
        console.error("Search Service Error:", {
          message: error.message,
          url: error.config?.url,
          status: error.response?.status,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Notify search service about product changes
   * @param {string} action - 'created', 'updated', or 'deleted'
   * @param {Object} product - Product data
   */
  async notifyProductChange(action, product) {
    if (!this.enabled || !this.baseURL) {
      return; // Silently skip if disabled
    }

    try {
      await this.client.post("/search/webhook/product", {
        action,
        product,
      });
    } catch (error) {
      // Log error but don't throw - we don't want to break product operations
      console.error(
        `Failed to notify search service about product ${action}:`,
        {
          productId: product?._id || product?.id,
          error: error.message,
        }
      );
    }
  }

  /**
   * Notify when product is created
   */
  async notifyProductCreated(product) {
    return this.notifyProductChange("created", product);
  }

  /**
   * Notify when product is updated
   */
  async notifyProductUpdated(product) {
    return this.notifyProductChange("updated", product);
  }

  /**
   * Notify when product is deleted
   */
  async notifyProductDeleted(productId) {
    return this.notifyProductChange("deleted", {
      _id: productId,
      id: productId,
    });
  }
}

module.exports = new SearchClient();
