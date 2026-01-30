/**
 * Map component types to category names/slugs
 * This helps filter products by component type
 */
const COMPONENT_TO_CATEGORY_MAP = {
  cpu: ["CPU", "Processor"],
  gpu: ["GPU", "VGA", "Graphics Card", "Video Card"],
  motherboard: ["Motherboard", "Mainboard", "Mobo"],
  ram: ["RAM", "Memory"],
  storage: ["Storage", "SSD", "HDD", "NVMe"],
  psu: ["PSU", "Power Supply"],
  case: ["Case", "Chassis", "Computer Case"],
  cooler: ["Cooler", "CPU Cooler", "AIO", "Air Cooler"],
  monitor: ["Monitor", "Display"],
  keyboard: ["Keyboard"],
  mouse: ["Mouse"],
  headset: ["Headset", "Headphone"],
};

/**
 * Normalize component type (e.g., 'vga' -> 'gpu')
 * @param {String} componentType - Component type
 * @returns {String} Normalized component type
 */
function normalizeComponentType(componentType) {
  if (!componentType) return null;
  const normalized = componentType.toLowerCase();
  
  // Map aliases to standard component types
  const aliasMap = {
    vga: 'gpu',
    graphics: 'gpu',
    'graphics card': 'gpu',
    'video card': 'gpu',
    mainboard: 'motherboard',
    mobo: 'motherboard',
    memory: 'ram',
    ssd: 'storage',
    hdd: 'storage',
    'power supply': 'psu',
    chassis: 'case',
    'computer case': 'case',
    'cpu cooler': 'cooler',
    aio: 'cooler',
    'air cooler': 'cooler',
    display: 'monitor',
    headphone: 'headset',
  };
  
  return aliasMap[normalized] || normalized;
}

/**
 * Get category names for a component type
 * @param {String} componentType - Component type (e.g., 'cpu', 'gpu', 'vga')
 * @returns {Array} Array of category names
 */
function getCategoryNamesForComponent(componentType) {
  const normalized = normalizeComponentType(componentType);
  if (!normalized) return [];
  return COMPONENT_TO_CATEGORY_MAP[normalized] || [];
}

/**
 * Check if a product matches component type
 * @param {Object} product - Product object
 * @param {String} componentType - Component type
 * @returns {Boolean}
 */
function productMatchesComponentType(product, componentType) {
  if (!componentType) return true;

  const categoryNames = getCategoryNamesForComponent(componentType);
  // If no category names found after normalization, return false (strict matching)
  // This prevents returning all products when componentType is invalid
  if (categoryNames.length === 0) {
    return false;
  }

  // Check product name or category name
  const productName = (product.name || "").toLowerCase();
  const categoryName = (product.category?.name || product.categoryId?.name || "").toLowerCase();
  const categorySlug = (product.category?.slug || product.categoryId?.slug || "").toLowerCase();

  return categoryNames.some(
    (name) => {
      const nameLower = name.toLowerCase();
      return (
        productName.includes(nameLower) ||
        categoryName.includes(nameLower) ||
        categorySlug.includes(nameLower)
      );
    }
  );
}

module.exports = {
  COMPONENT_TO_CATEGORY_MAP,
  normalizeComponentType,
  getCategoryNamesForComponent,
  productMatchesComponentType,
};
