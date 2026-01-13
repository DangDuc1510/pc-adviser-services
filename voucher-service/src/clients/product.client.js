const axios = require("axios");
const config = require("../config/env");
const { ProductServiceError } = require("../errors");

class ProductClient {
  constructor() {
    this.baseURL = config.PRODUCT_SERVICE_URL;
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
        console.error("Product Service Error:", error.message);
        if (error.response) {
          throw new ProductServiceError(
            error.response.data?.message || "Lỗi kết nối với Product Service"
          );
        }
        throw new ProductServiceError("Không thể kết nối với Product Service");
      }
    );
  }

  // Get product by ID
  async getProductById(productId) {
    try {
      const response = await this.client.get(`/products/${productId}`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error.message);
      throw error;
    }
  }

  // Get multiple products by IDs
  async getProductsByIds(productIds) {
    try {
      const promises = productIds.map((id) => this.getProductById(id));
      return await Promise.all(promises);
    } catch (error) {
      console.error("Error fetching multiple products:", error.message);
      throw error;
    }
  }

  // Get brand by ID
  async getBrandById(brandId) {
    try {
      const response = await this.client.get(`/brands/${brandId}`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Error fetching brand ${brandId}:`, error.message);
      throw error;
    }
  }

  // Get multiple brands by IDs
  async getBrandsByIds(brandIds) {
    try {
      const promises = brandIds.map((id) => this.getBrandById(id));
      return await Promise.all(promises);
    } catch (error) {
      console.error("Error fetching multiple brands:", error.message);
      throw error;
    }
  }

  // Get category by ID
  async getCategoryById(categoryId) {
    try {
      const response = await this.client.get(`/categories/${categoryId}`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Error fetching category ${categoryId}:`, error.message);
      throw error;
    }
  }

  // Get multiple categories by IDs
  async getCategoriesByIds(categoryIds) {
    try {
      const promises = categoryIds.map((id) => this.getCategoryById(id));
      return await Promise.all(promises);
    } catch (error) {
      console.error("Error fetching multiple categories:", error.message);
      throw error;
    }
  }
}

module.exports = new ProductClient();
