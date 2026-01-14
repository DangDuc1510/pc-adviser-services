const axios = require("axios");
const config = require("../config/env");
const { ValidationError, NotFoundError } = require("../errors");

class PromoCodeClient {
  constructor() {
    this.baseURL = config.VOUCHER_SERVICE_URL;
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
        console.error("Voucher Service Error:", error.message);
        if (error.response) {
          const status = error.response.status;
          const data = error.response.data;

          if (status === 404) {
            throw new NotFoundError(data?.message || "PromoCode không tồn tại");
          }
          if (status === 400) {
            throw new ValidationError(data?.message || "Dữ liệu không hợp lệ");
          }
          throw new Error(data?.message || "Lỗi kết nối với Voucher Service");
        }
        throw new Error("Không thể kết nối với Voucher Service");
      }
    );
  }

  /**
   * Validate and apply promo code
   * @param {string} code - Promo code
   * @param {string} userId - User ID
   * @param {Array} cartItems - Cart items
   * @param {number} subtotal - Subtotal amount
   * @returns {Promise<Object>}
   */
  async validateAndApplyPromoCode(code, userId, cartItems = [], subtotal = 0) {
    try {
      const response = await this.client.post("internal/promo-codes/validate", {
        code,
        userId,
        cartItems,
        subtotal,
      });
      return response.data?.data || response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Record usage of promo code (internal endpoint)
   * @param {string} code - Promo code
   * @param {number} discountAmount - Discount amount
   * @returns {Promise<Object>}
   */
  async recordUsage(code, discountAmount) {
    try {
      const response = await this.client.post(
        "internal/promo-codes/record-usage",
        {
          code,
          discountAmount: discountAmount || 0,
        }
      );

      return response.data || { success: true };
    } catch (error) {
      console.error("Error recording promo code usage:", error.message);
      // Don't throw - order creation should not fail if usage recording fails
      return { success: false };
    }
  }
}

module.exports = new PromoCodeClient();
