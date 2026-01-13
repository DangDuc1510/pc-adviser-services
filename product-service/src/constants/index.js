// Product status
const PRODUCT_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  DISCONTINUED: "discontinued",
  COMING_SOON: "coming-soon",
};

// Product types based on categories
const PRODUCT_TYPES = {
  CPU: "CPU",
  VGA: "VGA",
  RAM: "RAM",
  MAINBOARD: "Mainboard",
  STORAGE: "Storage",
  PSU: "PSU",
  CASE: "Case",
  COOLING: "Cooling",
  MONITOR: "Monitor",
  KEYBOARD: "Keyboard",
  MOUSE: "Mouse",
  HEADSET: "Headset",
  WEBCAM: "Webcam",
  AUDIO: "Audio",
  NETWORKING: "Networking",
  OTHER: "Other",
};

// Socket types for CPUs
const CPU_SOCKETS = {
  AM4: "AM4",
  AM5: "AM5",
  LGA1200: "LGA1200",
  LGA1700: "LGA1700",
};

// Memory types
const MEMORY_TYPES = {
  DDR4: "DDR4",
  DDR5: "DDR5",
};

// Form factors
const FORM_FACTORS = {
  ATX: "ATX",
  MICRO_ATX: "Micro-ATX",
  MINI_ITX: "Mini-ITX",
};

// Storage interfaces
const STORAGE_INTERFACES = {
  SATA_III: "SATA III",
  NVME_PCIE_3: "NVMe PCIe 3.0",
  NVME_PCIE_4: "NVMe PCIe 4.0",
};

// Default pagination
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// Price ranges for filtering
const PRICE_RANGES = {
  UNDER_1M: { min: 0, max: 1000000 },
  FROM_1M_TO_5M: { min: 1000000, max: 5000000 },
  FROM_5M_TO_10M: { min: 5000000, max: 10000000 },
  FROM_10M_TO_20M: { min: 10000000, max: 20000000 },
  ABOVE_20M: { min: 20000000, max: null },
};

// Sort options
const SORT_OPTIONS = {
  NEWEST: { field: "createdAt", order: -1 },
  OLDEST: { field: "createdAt", order: 1 },
  PRICE_LOW_TO_HIGH: { field: "pricing.originalPrice", order: 1 },
  PRICE_HIGH_TO_LOW: { field: "pricing.originalPrice", order: -1 },
  NAME_A_TO_Z: { field: "name", order: 1 },
  NAME_Z_TO_A: { field: "name", order: -1 },
  RATING: { field: "rating.average", order: -1 },
  POPULAR: { field: "sales", order: -1 },
  MOST_VIEWED: { field: "views", order: -1 },
};

// Stock levels
const STOCK_LEVELS = {
  OUT_OF_STOCK: 0,
  LOW_STOCK_THRESHOLD: 10,
  NORMAL_STOCK_THRESHOLD: 50,
};

// Currency
const CURRENCY = {
  VND: "VND",
  USD: "USD",
};

// Image constraints
const IMAGE_CONSTRAINTS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  MAX_COUNT: 10,
};

// Validation constraints
const VALIDATION = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 200,
  SKU_MIN_LENGTH: 3,
  SKU_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 5000,
  SHORT_DESCRIPTION_MAX_LENGTH: 500,
  MIN_PRICE: 0,
  MAX_PRICE: 1000000000, // 1 billion VND
  MIN_STOCK: 0,
  MAX_STOCK: 999999,
};

// Search configuration
const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 2,
  MAX_RESULTS: 50,
  FUZZY_THRESHOLD: 0.6,
};

// Product use cases for filtering
const USE_CASES = {
  GAMING: "Gaming",
  OFFICE: "Văn phòng",
  GRAPHICS_TECH: "Đồ họa - Kỹ thuật",
  ENTERPRISE: "Doanh nghiệp",
  STUDENT: "Học sinh - Sinh viên",
  STREAMING: "Streaming",
  MINING: "Mining",
  SERVER: "Server",
};

// Array of all valid use cases
const VALID_USE_CASES = Object.values(USE_CASES);

// Valid product colors
const VALID_COLORS = [
  "black",
  "white",
  "gray",
  "dark-gray",
  "light-gray",
  "red",
  "blue",
  "green",
  "yellow",
  "orange",
  "pink",
  "purple",
  "cyan",
  "brown",
  "silver",
  "gold",
  "rgb",
  "rgb-blue",
  "rgb-red",
  "rgb-green",
];

module.exports = {
  PRODUCT_STATUS,
  PRODUCT_TYPES,
  CPU_SOCKETS,
  MEMORY_TYPES,
  FORM_FACTORS,
  STORAGE_INTERFACES,
  PAGINATION,
  PRICE_RANGES,
  SORT_OPTIONS,
  STOCK_LEVELS,
  CURRENCY,
  IMAGE_CONSTRAINTS,
  VALIDATION,
  SEARCH_CONFIG,
  USE_CASES,
  VALID_USE_CASES,
  VALID_COLORS,
};
