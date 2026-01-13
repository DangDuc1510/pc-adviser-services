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
   * Falls back to /profile endpoint if internal endpoint fails and authToken is provided.
   *
   * @param {string} userId
   * @param {string} authToken - Optional JWT token (not used for internal endpoint, but kept for fallback)
   * @returns {Promise<Object|null>}
   */
  async getUserById(userId, authToken = null) {
    if (!userId) {
      return null;
    }

    try {
      // Use internal endpoint first (no auth required, for service-to-service calls)
      try {
        const response = await this.client.get(
          `/user/internal/users/${userId}`
        );
        return response.data?.data || response.data || null;
      } catch (internalError) {
        // If internal endpoint fails (404), try fallback methods
        if (internalError instanceof NotFoundError) {
          return null;
        }

        // If internal endpoint is not available, fallback to /profile if authToken provided
        if (authToken) {
          try {
            const headers = {
              Authorization: `Bearer ${authToken}`,
            };
            const response = await this.client.get("/profile", { headers });
            const profileData = response.data?.data || response.data;

            // Verify the profile matches requested userId (security check)
            if (profileData?._id?.toString() !== userId.toString()) {
              throw new NotFoundError(
                "Người dùng không tồn tại hoặc không có quyền truy cập"
              );
            }

            return profileData;
          } catch (profileError) {
            if (profileError instanceof NotFoundError) {
              return null;
            }
            throw profileError;
          }
        }

        // If no fallback available, throw the original error
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
   * Update customer stats (totalOrders, totalSpent) by userId
   * Internal endpoint for service-to-service communication
   * @param {string} userId - User ID
   * @param {number} totalOrders - Number of orders to increment (default: 1)
   * @param {number} totalSpent - Amount to increment (in VND)
   * @returns {Promise<Object|null>}
   */
  async updateCustomerStats(userId, totalOrders = 1, totalSpent = 0) {
    if (!userId) {
      return null;
    }

    try {
      const response = await this.client.patch(
        `/customers/internal/${userId}/stats`,
        {
          totalOrders,
          totalSpent,
        }
      );
      return response.data?.data || response.data || null;
    } catch (error) {
      console.error(
        `Error updating customer stats for ${userId}:`,
        error.message
      );
      // Don't throw error, just log it - order creation should not fail if stats update fails
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
      const response = await this.client.get('/customers', { params: filters });
      return response.data?.data || response.data || { customers: [], pagination: {} };
    } catch (error) {
      console.error('Error fetching customers:', error.message);
      return { customers: [], pagination: {} };
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
      console.error(`Error fetching customer for user ${userId}:`, error.message);
      return null;
    }
  }
}

module.exports = new IdentityClient();
