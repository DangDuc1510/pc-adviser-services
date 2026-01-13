const axios = require("axios");
const { ExternalServiceError } = require("../errors");

class VoucherClient {
  constructor() {
    this.baseURL = process.env.VOUCHER_SERVICE_URL || "http://localhost:3008";
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Trigger voucher distribution for user registration
   * @param {string} userId - User ID to distribute voucher to
   * @returns {Promise<Object>} Result of voucher distribution
   */
  async triggerUserRegisteredVoucher(userId) {
    try {
      const response = await this.client.post("/voucher-triggers/trigger", {
        type: "user_registered",
        jwtSecret: process.env.JWT_SECRET,
        userId: userId.toString(),
      });

      return response.data?.data || response.data;
    } catch (error) {
      // Don't throw error - voucher distribution failure shouldn't break registration
      console.error("Error triggering user registered voucher:", error.message);

      // Return a safe response indicating failure but not throwing
      return {
        success: false,
        message: `Failed to trigger voucher distribution: ${error.message}`,
        distributed: 0,
        results: [],
      };
    }
  }

  /**
   * Trigger voucher distribution for spending milestone
   * @param {string} userId - User ID
   * @param {number} amount - Spending amount
   * @returns {Promise<Object>} Result of voucher distribution
   */
  async triggerSpendingMilestoneVoucher(userId, amount) {
    try {
      const response = await this.client.post("/voucher-triggers/trigger", {
        type: "spending_milestone",
        jwtSecret: process.env.JWT_SECRET,
        userId: userId.toString(),
      });

      return response.data?.data || response.data;
    } catch (error) {
      console.error(
        "Error triggering spending milestone voucher:",
        error.message
      );
      return {
        success: false,
        message: `Failed to trigger voucher distribution: ${error.message}`,
        distributed: 0,
        results: [],
      };
    }
  }

  /**
   * Trigger voucher distribution for birthday
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result of voucher distribution
   */
  async triggerBirthdayVoucher(userId) {
    try {
      const response = await this.client.post("/voucher-triggers/trigger", {
        type: "birthday",
        jwtSecret: process.env.JWT_SECRET,
        userId: userId.toString(),
      });

      return response.data?.data || response.data;
    } catch (error) {
      console.error("Error triggering birthday voucher:", error.message);
      return {
        success: false,
        message: `Failed to trigger voucher distribution: ${error.message}`,
        distributed: 0,
        results: [],
      };
    }
  }
}

module.exports = new VoucherClient();
