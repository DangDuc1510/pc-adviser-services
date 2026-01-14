const axios = require("axios");
const { ExternalServiceError } = require("../errors");
const config = require("../config/env");

class VoucherClient {
  constructor() {
    this.baseURL = config.VOUCHER_SERVICE_URL;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Trigger when segmentation changed
   */
  async onSegmentationChanged(userId, customerId, oldSegmentation, newSegmentation) {
    try {
      const response = await this.client.post("/voucher-triggers/segmentation", {
        userId,
        customerId,
        oldSegmentation,
        newSegmentation,
      });
      return response.data;
    } catch (error) {
      // Don't throw - segmentation update should not fail if voucher trigger fails
      console.error(`Error triggering voucher for segmentation change ${customerId}:`, error.message);
      return null;
    }
  }
}

module.exports = new VoucherClient();

