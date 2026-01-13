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
 * Get category names for a component type
 * @param {String} componentType - Component type (e.g., 'cpu', 'gpu')
 * @returns {Array} Array of category names
 */
function getCategoryNamesForComponent(componentType) {
  const normalized = componentType?.toLowerCase();
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
  if (categoryNames.length === 0) return true;

  // Check product name or category name
  const productName = (product.name || "").toLowerCase();
  const categoryName = (product.category?.name || "").toLowerCase();

  return categoryNames.some(
    (name) =>
      productName.includes(name.toLowerCase()) ||
      categoryName.includes(name.toLowerCase())
  );
}

module.exports = {
  COMPONENT_TO_CATEGORY_MAP,
  getCategoryNamesForComponent,
  productMatchesComponentType,
};
