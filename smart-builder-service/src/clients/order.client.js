const axios = require("axios");
const { ORDER_SERVICE } = require("../config/services");
const { ExternalServiceError } = require("../errors");

class OrderClient {
  constructor() {
    this.baseURL = ORDER_SERVICE.BASE_URL;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async getUserOrders(userId, options = {}) {
    try {
      // Use internal endpoint: GET /orders/internal/user/:userId (no auth required)
      const { limit = 1000, skip = 0, status, paymentStatus } = options;
      const params = {};
      if (status) params.status = status;
      if (paymentStatus) params.paymentStatus = paymentStatus;
      if (limit) params.limit = limit;
      if (skip) params.skip = skip;

      const response = await this.client.get(
        `/orders/internal/user/${userId.toString()}`,
        { params }
      );
      return response.data.data || response.data;
    } catch (error) {
      console.error(
        `[OrderClient] Error fetching orders for userId ${userId}:`,
        error.message
      );
      if (error.response?.status === 404) {
        return {
          orders: [],
          total: 0,
          limit: options.limit || 50,
          skip: options.skip || 0,
        };
      }
      throw new ExternalServiceError(
        `Failed to fetch user orders: ${error.message}`,
        error.response?.status
      );
    }
  }

  async getOrder(orderId) {
    try {
      const response = await this.client.get(`/orders/${orderId}`);
      return response.data.data || response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new ExternalServiceError(
        `Failed to fetch order: ${error.message}`,
        error.response?.status
      );
    }
  }
}

module.exports = new OrderClient();
