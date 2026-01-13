// User roles
const USER_ROLES = {
  CUSTOMER: "customer",
  ADMIN: "admin",
  EMPLOYEE: "employee",
};

// Gender options
const GENDERS = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
};

// Default pagination values
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// JWT
const JWT = {
  DEFAULT_EXPIRES_IN: "24h",
  REFRESH_EXPIRES_IN: "7d",
  RESET_TOKEN_EXPIRES_IN: "1h",
};

// Redis blacklist expiry
const REDIS = {
  BLACKLIST_EXPIRY: 60 * 60 * 24, // 24 hours in seconds
};

// Validation constraints
const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,
  MAX_NAME_LENGTH: 100,
  MAX_PHONE_LENGTH: 15,
};

// Permissions
const PERMISSIONS = {
  // User Management
  VIEW_USERS: "view_users",
  CREATE_USERS: "create_users",
  EDIT_USERS: "edit_users",
  DELETE_USERS: "delete_users",
  MANAGE_USER_ROLES: "manage_user_roles",

  // Product Management
  VIEW_PRODUCTS: "view_products",
  CREATE_PRODUCTS: "create_products",
  EDIT_PRODUCTS: "edit_products",
  DELETE_PRODUCTS: "delete_products",
  MANAGE_INVENTORY: "manage_inventory",
  VIEW_PRODUCT_ANALYTICS: "view_product_analytics",

  // Category & Brand Management
  VIEW_CATEGORIES: "view_categories",
  MANAGE_CATEGORIES: "manage_categories",
  VIEW_BRANDS: "view_brands",
  MANAGE_BRANDS: "manage_brands",

  // Product Group Management
  MANAGE_PRODUCT_GROUPS: "manage_product_groups",

  // Order Management
  VIEW_ORDERS: "view_orders",
  CREATE_ORDERS: "create_orders",
  EDIT_ORDERS: "edit_orders",
  CANCEL_ORDERS: "cancel_orders",
  MANAGE_ORDER_STATUS: "manage_order_status",
  PROCESS_REFUNDS: "process_refunds",
  VIEW_ANALYTICS_ORDERS: "view_analytics_orders",

  // Smart Builder
  VIEW_BUILDS: "view_builds",
  CREATE_BUILDS: "create_builds",
  MANAGE_COMPATIBILITY_RULES: "manage_compatibility_rules",

  // System & Reports
  VIEW_SYSTEM_LOGS: "view_system_logs",
  VIEW_ANALYTICS: "view_analytics",
  MANAGE_NOTIFICATIONS: "manage_notifications",

  //Coupon Management
  VIEW_COUPONS: "view_coupons",
  CREATE_COUPONS: "create_coupons",
  EDIT_COUPONS: "edit_coupons",
  DELETE_COUPONS: "delete_coupons",
};

const ROLE_PERMISSIONS = {
  [USER_ROLES.CUSTOMER]: [
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_CATEGORIES,
    PERMISSIONS.VIEW_BRANDS,
    PERMISSIONS.CREATE_ORDERS,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.CREATE_BUILDS,
    PERMISSIONS.VIEW_BUILDS,
  ],

  [USER_ROLES.EMPLOYEE]: [
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_CATEGORIES,
    PERMISSIONS.VIEW_BRANDS,
    PERMISSIONS.CREATE_ORDERS,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.EDIT_ORDERS,
    PERMISSIONS.VIEW_ANALYTICS_ORDERS,
    PERMISSIONS.MANAGE_ORDER_STATUS,
    PERMISSIONS.CREATE_BUILDS,
    PERMISSIONS.VIEW_BUILDS,
    PERMISSIONS.CREATE_PRODUCTS,
    PERMISSIONS.EDIT_PRODUCTS,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.MANAGE_BRANDS,
    PERMISSIONS.MANAGE_PRODUCT_GROUPS,
    PERMISSIONS.MANAGE_COMPATIBILITY_RULES,
    PERMISSIONS.VIEW_PRODUCT_ANALYTICS,
  ],

  [USER_ROLES.ADMIN]: Object.values(PERMISSIONS),
};

module.exports = {
  USER_ROLES,
  GENDERS,
  PAGINATION,
  JWT,
  REDIS,
  VALIDATION,
  PERMISSIONS,
  ROLE_PERMISSIONS,
};
