const axios = require('axios');
const { SEARCH_SERVICE } = require('../config/services');
const logger = require('../utils/logger');

/**
 * Search Service Client
 * Gọi API từ search-service thay vì connect trực tiếp đến Elasticsearch
 */
class SearchClient {
  constructor() {
    this.baseURL = SEARCH_SERVICE.BASE_URL;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Search products với filters
   * @param {Object} filters - Search filters
   * @returns {Promise<Array>} Products array
   */
  async searchProducts(filters = {}) {
    try {
      logger.debug('[SearchClient] Searching products', { filters });
      
      const response = await this.client.get('/search', {
        params: filters,
      });

      // Handle different response formats
      if (response.data && response.data.success) {
        return response.data.products || [];
      }
      
      return response.data?.products || response.data || [];
    } catch (error) {
      logger.error('[SearchClient] Error searching products', {
        error: error.message,
        status: error.response?.status,
        filters,
      });
      
      // Return empty array on error (fallback)
      return [];
    }
  }

  /**
   * Filter products by compatibility requirements
   * Gọi API mới trong search-service để filter theo specifications
   * @param {Object} options - Filter options
   * @param {String} options.componentType - Component type
   * @param {Object} options.requirements - Compatibility requirements
   * @param {Object} options.userPreferences - User preferences
   * @param {Number} options.limit - Limit results
   * @returns {Promise<Array>} Filtered products
   */
  async filterByCompatibility(options) {
    const {
      componentType,
      requirements = {},
      userPreferences = {},
      limit = 30,
    } = options;

    try {
      logger.debug('[SearchClient] Filtering by compatibility', {
        componentType,
        requirements: Object.keys(requirements),
        limit,
      });

      // Build query parameters
      const params = {
        size: limit,
        status: 'active',
      };

      // Add filters based on requirements
      if (requirements.socket) {
        params.socket = requirements.socket;
      }

      if (requirements.ramType) {
        params.ramType = requirements.ramType;
      }

      if (requirements.formFactor) {
        params.formFactor = requirements.formFactor;
      }

      if (requirements.powerRequirement > 0) {
        params.minWattage = requirements.powerRequirement;
      }

      if (requirements.budgetMin) {
        params.minPrice = requirements.budgetMin;
      }

      if (requirements.budgetMax) {
        params.maxPrice = requirements.budgetMax;
      }

      // User preferences for boosting
      if (userPreferences.brands && userPreferences.brands.size > 0) {
        params.brand = Array.from(userPreferences.brands.keys()).join(',');
      }

      if (userPreferences.categories && userPreferences.categories.size > 0) {
        params.category = Array.from(userPreferences.categories.keys()).join(',');
      }

      // Call search-service API
      // Note: Cần thêm endpoint mới trong search-service để hỗ trợ filter này
      // Tạm thời dùng endpoint /search với filters cơ bản
      const response = await this.client.get('/search/filter', {
        params,
      });

      if (response.data && response.data.success) {
        return response.data.products || [];
      }

      return response.data?.products || [];
    } catch (error) {
      logger.error('[SearchClient] Error filtering by compatibility', {
        error: error.message,
        status: error.response?.status,
        componentType,
      });

      // Fallback: Try basic search if filter endpoint doesn't exist
      if (error.response?.status === 404) {
        logger.warn('[SearchClient] Filter endpoint not found, using basic search');
        return this.searchProducts({
          size: limit,
          status: 'active',
          ...(requirements.budgetMin && { minPrice: requirements.budgetMin }),
          ...(requirements.budgetMax && { maxPrice: requirements.budgetMax }),
        });
      }

      return [];
    }
  }
}

module.exports = new SearchClient();
