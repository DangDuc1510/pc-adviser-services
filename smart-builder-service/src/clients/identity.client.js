const axios = require("axios");
const { IDENTITY_SERVICE } = require("../config/services");
const { ExternalServiceError } = require("../errors");

class IdentityClient {
  constructor() {
    this.baseURL = IDENTITY_SERVICE.BASE_URL;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async getCustomerBehavior(userId, options = {}) {
    try {
      // Use internal endpoint: GET /behavior/internal/user/:userId (no auth required)
      const { limit = 1000, page = 1, eventType, entityType } = options;
      const params = {};
      if (limit) params.limit = limit;
      if (page) params.page = page;
      if (eventType) params.eventType = eventType;
      if (entityType) params.entityType = entityType;

      const response = await this.client.get(
        `/behavior/internal/user/${userId}`,
        { params }
      );
      console.log("[Segmentation] Response behavior", response.data);
      // Internal endpoint returns { status: "success", data: {...} }
      const result = response.data.data || response.data;
      return result;
    } catch (error) {
      console.error(
        `[IdentityClient] Error fetching behavior for user ${userId}:`,
        error.message
      );
      if (error.response?.status === 404) {
        return { events: [], pagination: { total: 0 } };
      }
      throw new ExternalServiceError(
        `Failed to fetch user behavior: ${error.message}`,
        error.response?.status
      );
    }
  }

  async getUserBehavior(userId, options = {}) {
    try {
      const response = await this.client.get(
        `/behavior/internal/user/${userId}`,
        {
          params: options,
        }
      );
      return response.data.data || response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { events: [], pagination: { total: 0 } };
      }
      throw new ExternalServiceError(
        `Failed to fetch user behavior: ${error.message}`,
        error.response?.status
      );
    }
  }
  async getCustomerInfoByUserId(userId, options = {}) {
    try {
      const response = await this.client.get(
        `/customers/internal/user/${userId}`,
        {
          params: options,
        }
      );
      return response.data.data || response.data;
    } catch (error) {
      throw new ExternalServiceError(
        `Failed to fetch customer info by user id: ${error.message}`,
        error.response?.status
      );
    }
  }

  async getBehaviorSummary(userId) {
    try {
      const response = await this.client.get(
        `/behavior/internal/user/${userId}/summary`
      );
      return response.data.data || response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return {
          eventTypeSummary: [],
          entityTypeSummary: [],
          topProducts: [],
        };
      }
      throw new ExternalServiceError(
        `Failed to fetch behavior summary: ${error.message}`,
        error.response?.status
      );
    }
  }

  async getBehaviorTimeline(userId, options = {}) {
    try {
      const response = await this.client.get(
        `/behavior/internal/user/${userId}/timeline`,
        { params: options }
      );
      return response.data.data || response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return [];
      }
      throw new ExternalServiceError(
        `Failed to fetch behavior timeline: ${error.message}`,
        error.response?.status
      );
    }
  }

  // Get customer by userId (internal endpoint)
  async getCustomerById(userId) {
    try {
      const response = await this.client.get(
        `/customers/internal/user/${userId}`
      );
      console.log("response okok", response.data);
      return response.data.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new ExternalServiceError(
        `Failed to fetch customer: ${error.message}`,
        error.response?.status
      );
    }
  }

  // Update customer segmentation (internal endpoint)
  async updateCustomerSegmentation(customerId, segmentation) {
    try {
      const response = await this.client.patch(
        `/customers/internal/${customerId}/segmentation`,
        { segmentation }
      );
      return response.data.data;
    } catch (error) {
      throw new ExternalServiceError(
        `Failed to update customer segmentation: ${error.message}`,
        error.response?.status
      );
    }
  }

  // Get segmentation statistics (internal endpoint)
  async getSegmentationStats() {
    try {
      const response = await this.client.get(
        `/customers/internal/segmentation/stats`
      );
      return response.data.data;
    } catch (error) {
      throw new ExternalServiceError(
        `Failed to fetch segmentation stats: ${error.message}`,
        error.response?.status
      );
    }
  }

  // Get all customer IDs (internal endpoint)
  // Returns array of { id, updatedAt } sorted by updatedAt
  async getAllCustomerIds() {
    try {
      const response = await this.client.get(`/customers/internal/ids`);
      const customerData = response.data.data || [];
      // Return array of IDs (for backward compatibility)
      return customerData.map((c) => (typeof c === "string" ? c : c.id));
    } catch (error) {
      throw new ExternalServiceError(
        `Failed to fetch customer IDs: ${error.message}`,
        error.response?.status
      );
    }
  }

  // Get all customer IDs with metadata (internal endpoint)
  // Returns full customer data sorted by updatedAt
  async getAllCustomerIdsWithMetadata() {
    console.log("vao day3");
    try {
      const response = await this.client.get(`/customers/internal/ids`);
      return response.data.data || [];
    } catch (error) {
      throw new ExternalServiceError(
        `Failed to fetch customer IDs: ${error.message}`,
        error.response?.status
      );
    }
  }

  // Get users by segmentation type (internal endpoint)
  // Returns users (only registered customers with userId) filtered by segmentation type
  async getUsersBySegmentationType(segmentationType, options = {}) {
    try {
      const { page = 1, limit = 1000 } = options;
      const response = await this.client.get(
        `/customers/internal/segmentation/${segmentationType}/users`,
        {
          params: { page, limit },
        }
      );
      return response.data.data || { users: [], pagination: {} };
    } catch (error) {
      throw new ExternalServiceError(
        `Failed to fetch users by segmentation type: ${error.message}`,
        error.response?.status
      );
    }
  }
}

module.exports = new IdentityClient();
