const axios = require("axios");
const config = require("../config/env");
const { IdentityServiceError, NotFoundError } = require("../errors");

class IdentityClient {
  constructor() {
    this.baseURL = config.IDENTITY_SERVICE_URL;
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
        console.error("Identity Service Error:", error.message);
        if (error.response) {
          const status = error.response.status;
          if (status === 404) {
            throw new NotFoundError(
              error.response.data?.message || "Người dùng không tồn tại"
            );
          }
          throw new IdentityServiceError(
            error.response.data?.message || "Lỗi kết nối với Identity Service"
          );
        }
        throw new IdentityServiceError(
          "Không thể kết nối với Identity Service"
        );
      }
    );
  }

  /**
   * Get detailed user information by ID from Identity Service via HTTP API.
   * Uses internal endpoint /user/internal/users/:id (no auth required) for service-to-service calls.
   *
   * @param {string} userId
   * @returns {Promise<Object|null>}
   */
  async getUserById(userId) {
    if (!userId) {
      return null;
    }

    try {
      // Use internal endpoint (no auth required, for service-to-service calls)
      try {
        const response = await this.client.get(
          `/user/internal/users/${userId}`
        );
        return response.data?.data || response.data || null;
      } catch (internalError) {
        // If internal endpoint fails (404), return null
        if (internalError instanceof NotFoundError) {
          return null;
        }
        throw internalError;
      }
    } catch (error) {
      // If 404, return null instead of throwing
      if (error instanceof NotFoundError) {
        return null;
      }
      // Log error for debugging but don't expose internal details
      console.error(`Error fetching user ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get customer by userId
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>}
   */
  async getCustomerByUserId(userId) {
    try {
      const response = await this.client.get(`/customers/user/${userId}`);
      return response.data?.data || response.data || null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error(
        `Error fetching customer for user ${userId}:`,
        error.message
      );
      return null;
    }
  }

  /**
   * Get customers with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>}
   */
  async getCustomers(filters = {}) {
    try {
      const response = await this.client.get("/customers", { params: filters });
      return (
        response.data?.data ||
        response.data || { customers: [], pagination: {} }
      );
    } catch (error) {
      console.error("Error fetching customers:", error.message);
      return { customers: [], pagination: {} };
    }
  }

  /**
   * Get customers by segmentation types
   * @param {Array} segmentationTypes - Array of segmentation types
   * @returns {Promise<Object>}
   */
  async getCustomersBySegmentation(segmentationTypes) {
    try {
      const response = await this.client.post("/segmentation/customers/batch", {
        segmentationTypes,
      });
      return response.data?.data || response.data || { customers: [] };
    } catch (error) {
      console.error("Error fetching customers by segmentation:", error.message);
      return { customers: [] };
    }
  }
}

module.exports = new IdentityClient();
