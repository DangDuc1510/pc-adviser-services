const config = require('./env');

module.exports = {
  PRODUCT_SERVICE_URL: config.PRODUCT_SERVICE_URL,
  IDENTITY_SERVICE_URL: config.IDENTITY_SERVICE_URL,
  ORDER_SERVICE_URL: config.ORDER_SERVICE_URL,
  
  // API endpoints
  PRODUCT_SERVICE: {
    BASE_URL: config.PRODUCT_SERVICE_URL,
    GET_PRODUCT: (id) => `${config.PRODUCT_SERVICE_URL}/products/${id}`,
    GET_PRODUCTS: `${config.PRODUCT_SERVICE_URL}/products`,
    GET_CATEGORY: (id) => `${config.PRODUCT_SERVICE_URL}/categories/${id}`,
  },
  
  IDENTITY_SERVICE: {
    BASE_URL: config.IDENTITY_SERVICE_URL,
    GET_CUSTOMER_BEHAVIOR: (customerId) => `${config.IDENTITY_SERVICE_URL}/api/v1/behavior/customer/${customerId}`,
    GET_USER_BEHAVIOR: (userId) => `${config.IDENTITY_SERVICE_URL}/api/v1/behavior/user/${userId}`,
    GET_BEHAVIOR_SUMMARY: (customerId) => `${config.IDENTITY_SERVICE_URL}/api/v1/behavior/customer/${customerId}/summary`,
  },
  
  ORDER_SERVICE: {
    BASE_URL: config.ORDER_SERVICE_URL,
    GET_USER_ORDERS: (userId) => `${config.ORDER_SERVICE_URL}/api/v1/orders/user/${userId}`,
  }
};

