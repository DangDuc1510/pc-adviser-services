const axios = require('axios');
const config = require('../config/env');
const { ExternalServiceError } = require('../errors');
const logger = require('../utils/logger');

class IntegrationService {
  constructor() {
    this.productServiceUrl = config.PRODUCT_SERVICE_URL;
    this.orderServiceUrl = config.ORDER_SERVICE_URL;
    this.builderServiceUrl = config.BUILDER_SERVICE_URL;
    
    // HTTP clients with timeout
    this.httpClient = axios.create({
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Get product information from Product Service
   */
  async getProduct(productId, authToken = null) {
    try {
      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await this.httpClient.get(
        `${this.productServiceUrl}/products/${productId}`,
        { headers }
      );

      return response.data;
    } catch (error) {
      logger.error('Error fetching product from Product Service:', error.message);
      
      if (error.response) {
        throw new ExternalServiceError(
          `Product Service error: ${error.response.status} - ${error.response.statusText}`,
          error.response.status
        );
      }
      
      throw new ExternalServiceError(`Product Service unavailable: ${error.message}`, 503);
    }
  }

  /**
   * Search products from Product Service
   */
  async searchProducts(query, filters = {}, authToken = null) {
    try {
      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await this.httpClient.get(
        `${this.productServiceUrl}/products`,
        {
          params: {
            search: query,
            ...filters,
            limit: filters.limit || 10
          },
          headers
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error searching products:', error.message);
      
      if (error.response) {
        throw new ExternalServiceError(
          `Product Service error: ${error.response.status}`,
          error.response.status
        );
      }
      
      throw new ExternalServiceError('Product Service unavailable', 503);
    }
  }

  /**
   * Get build history from Smart Builder Service
   */
  async getBuildHistory(userId, buildId = null, authToken = null) {
    try {
      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      let url = `${this.builderServiceUrl}/pc-builder/history`;
      if (buildId) {
        url = `${this.builderServiceUrl}/pc-builder/${buildId}`;
      } else if (userId) {
        url += `?userId=${userId}`;
      }

      const response = await this.httpClient.get(url, { headers });

      return response.data;
    } catch (error) {
      logger.error('Error fetching build history:', error.message);
      
      if (error.response) {
        throw new ExternalServiceError(
          `Builder Service error: ${error.response.status}`,
          error.response.status
        );
      }
      
      throw new ExternalServiceError('Builder Service unavailable', 503);
    }
  }

  /**
   * Get order status from Order Service
   */
  async getOrderStatus(orderId, authToken = null) {
    try {
      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await this.httpClient.get(
        `${this.orderServiceUrl}/orders/${orderId}`,
        { headers }
      );

      return response.data;
    } catch (error) {
      logger.error('Error fetching order status:', error.message);
      
      if (error.response) {
        throw new ExternalServiceError(
          `Order Service error: ${error.response.status}`,
          error.response.status
        );
      }
      
      throw new ExternalServiceError('Order Service unavailable', 503);
    }
  }

  /**
   * Get user orders from Order Service
   */
  async getUserOrders(userId, authToken = null) {
    try {
      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await this.httpClient.get(
        `${this.orderServiceUrl}/orders`,
        {
          params: { userId },
          headers
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error fetching user orders:', error.message);
      
      if (error.response) {
        throw new ExternalServiceError(
          `Order Service error: ${error.response.status}`,
          error.response.status
        );
      }
      
      throw new ExternalServiceError('Order Service unavailable', 503);
    }
  }

  /**
   * Health check for external services
   */
  async checkServicesHealth() {
    const health = {
      productService: false,
      orderService: false,
      builderService: false
    };

    try {
      await this.httpClient.get(`${this.productServiceUrl}/health`);
      health.productService = true;
    } catch (error) {
      logger.warn('Product Service health check failed');
    }

    try {
      await this.httpClient.get(`${this.orderServiceUrl}/health`);
      health.orderService = true;
    } catch (error) {
      logger.warn('Order Service health check failed');
    }

    try {
      await this.httpClient.get(`${this.builderServiceUrl}/health`);
      health.builderService = true;
    } catch (error) {
      logger.warn('Builder Service health check failed');
    }

    return health;
  }
}

module.exports = new IntegrationService();

