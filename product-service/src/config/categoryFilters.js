// Mapping sub-filters for each component type
const CATEGORY_FILTERS_CONFIG = {
  CPU: [
    {
      key: "specs.series",
      label: "Dòng sản phẩm",
      type: "multi-select",
      field: "specifications.series",
    },
    {
      key: "specs.socket",
      label: "Socket",
      type: "multi-select",
      field: "specifications.socket",
    },
    {
      key: "specs.cores",
      label: "Số nhân thực",
      type: "multi-select",
      field: "specifications.cores",
    },
    {
      key: "specs.threads",
      label: "Số luồng",
      type: "multi-select",
      field: "specifications.threads",
    },
    {
      key: "specs.cpuBrand",
      label: "Hãng sản xuất",
      type: "multi-select",
      field: "specifications.cpuBrand",
    },
    {
      key: "specs.generation",
      label: "Thế hệ",
      type: "multi-select",
      field: "specifications.generation",
    },
  ],
  VGA: [
    {
      key: "specs.chipsetManufacturer",
      label: "Hãng chipset",
      type: "multi-select",
      field: "specifications.chipsetManufacturer",
    },
    {
      key: "specs.graphicsChipSeries",
      label: "Dòng chipset",
      type: "multi-select",
      field: "specifications.graphicsChipSeries",
    },
    {
      key: "specs.chipset",
      label: "Chipset",
      type: "multi-select",
      field: "specifications.chipset",
    },
    {
      key: "specs.memory",
      label: "Bộ nhớ",
      type: "multi-select",
      field: "specifications.memory",
    },
    {
      key: "specs.memoryInterface",
      label: "Bus bộ nhớ",
      type: "multi-select",
      field: "specifications.memoryInterface",
    },
  ],
  RAM: [
    {
      key: "specs.generation",
      label: "Thế hệ RAM",
      type: "multi-select",
      field: "specifications.generation",
    },
    {
      key: "specs.capacity",
      label: "Dung lượng",
      type: "multi-select",
      field: "specifications.capacity",
    },
    {
      key: "specs.busSpeed",
      label: "Tốc độ bus",
      type: "multi-select",
      field: "specifications.busSpeed",
    },
    {
      key: "specs.formFactor",
      label: "Form Factor",
      type: "multi-select",
      field: "specifications.formFactor",
    },
    {
      key: "specs.timing",
      label: "Timing",
      type: "multi-select",
      field: "specifications.timing",
    },
  ],
  Mainboard: [
    {
      key: "specs.chipsetMB",
      label: "Chipset",
      type: "multi-select",
      field: "specifications.chipsetMB",
    },
    {
      key: "specs.socketMB",
      label: "Socket",
      type: "multi-select",
      field: "specifications.socketMB",
    },
    {
      key: "specs.formFactorMB",
      label: "Form Factor",
      type: "multi-select",
      field: "specifications.formFactorMB",
    },
    {
      key: "specs.ramType",
      label: "Loại RAM",
      type: "multi-select",
      field: "specifications.ramType",
    },
    {
      key: "specs.memorySlots",
      label: "Số khe RAM",
      type: "multi-select",
      field: "specifications.memorySlots",
    },
  ],
  Storage: [
    {
      key: "specs.storageType",
      label: "Loại lưu trữ",
      type: "multi-select",
      field: "specifications.storageType",
    },
    {
      key: "specs.interface",
      label: "Giao tiếp",
      type: "multi-select",
      field: "specifications.interface",
    },
    {
      key: "specs.capacity",
      label: "Dung lượng",
      type: "multi-select",
      field: "specifications.capacity",
    },
    {
      key: "specs.formFactorStorage",
      label: "Form Factor",
      type: "multi-select",
      field: "specifications.formFactorStorage",
    },
  ],
  PSU: [
    {
      key: "specs.wattage",
      label: "Công suất",
      type: "multi-select",
      field: "specifications.wattage",
    },
    {
      key: "specs.efficiency",
      label: "Hiệu suất",
      type: "multi-select",
      field: "specifications.efficiency",
    },
    {
      key: "specs.modular",
      label: "Loại dây",
      type: "multi-select",
      field: "specifications.modular",
    },
  ],
  Case: [
    {
      key: "specs.caseType",
      label: "Loại case",
      type: "multi-select",
      field: "specifications.caseType",
    },
    {
      key: "specs.material",
      label: "Chất liệu",
      type: "multi-select",
      field: "specifications.material",
    },
    {
      key: "specs.supportedMainboard",
      label: "Mainboard hỗ trợ",
      type: "multi-select",
      field: "specifications.supportedMainboard",
    },
  ],
  Cooling: [
    {
      key: "specs.coolingType",
      label: "Loại tản nhiệt",
      type: "multi-select",
      field: "specifications.coolingType",
    },
    {
      key: "specs.socketCompatibility",
      label: "Socket tương thích",
      type: "multi-select",
      field: "specifications.socketCompatibility",
    },
    {
      key: "specs.fanSize",
      label: "Kích thước quạt",
      type: "multi-select",
      field: "specifications.fanSize",
    },
  ],
};

module.exports = {
  CATEGORY_FILTERS_CONFIG,
};
