const axios = require("axios");
const { ExternalServiceError } = require("../errors");

class OrderClient {
  constructor() {
    this.baseURL = process.env.ORDER_SERVICE_URL || "http://localhost:3003";
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
      const response = await this.client.get(`/api/v1/orders/user/${userId}`, {
        params: options,
      });
      return response.data.data || response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { orders: [], pagination: { total: 0 } };
      }
      throw new ExternalServiceError(
        `Failed to fetch user orders: ${error.message}`,
        error.response?.status
      );
    }
  }

  async getOrder(orderId) {
    try {
      const response = await this.client.get(`/api/v1/orders/${orderId}`);
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
