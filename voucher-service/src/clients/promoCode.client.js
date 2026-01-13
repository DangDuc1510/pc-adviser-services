const axios = require("axios");
const config = require("../config/env");
const { OrderServiceError, ValidationError, NotFoundError } = require("../errors");

class PromoCodeClient {
  constructor() {
    this.baseURL = config.ORDER_SERVICE_URL;
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
        console.error("Order Service Error:", error.message);
        if (error.response) {
          const status = error.response.status;
          const data = error.response.data;
          
          if (status === 404) {
            throw new NotFoundError(
              data?.message || "PromoCode không tồn tại"
            );
          }
          if (status === 400) {
            throw new ValidationError(
              data?.message || "Dữ liệu không hợp lệ"
            );
          }
          throw new OrderServiceError(
            data?.message || "Lỗi kết nối với Order Service"
          );
        }
        throw new OrderServiceError(
          "Không thể kết nối với Order Service"
        );
      }
    );
  }

  /**
   * Create a new promo code via Order Service API
   * Note: This requires authentication. For service-to-service calls,
   * you may need to use a service token or internal endpoint.
   * 
   * @param {Object} promoCodeData - Promo code data
   * @param {string} serviceToken - Optional service token for authentication
   * @returns {Promise<Object>}
   */
  async createPromoCode(promoCodeData, serviceToken = null) {
    try {
      const headers = {};
      if (serviceToken) {
        headers.Authorization = `Bearer ${serviceToken}`;
      }

      const response = await this.client.post(
        "/promo-codes",
        promoCodeData,
        { headers }
      );
      
      return response.data?.data || response.data;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      console.error("Error creating promo code:", error.message);
      throw error;
    }
  }

  /**
   * Get promo code by code
   * @param {string} code - Promo code
   * @param {string} serviceToken - Optional service token
   * @returns {Promise<Object>}
   */
  async getPromoCodeByCode(code, serviceToken = null) {
    try {
      const headers = {};
      if (serviceToken) {
        headers.Authorization = `Bearer ${serviceToken}`;
      }

      const response = await this.client.get(
        `/promo-codes/code/${code}`,
        { headers }
      );
      
      return response.data?.data || response.data;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return null;
      }
      throw error;
    }
  }
}

module.exports = new PromoCodeClient();

