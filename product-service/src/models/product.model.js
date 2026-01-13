const mongoose = require("mongoose");

// Pricing Schema
const pricingSchema = new mongoose.Schema(
  {
    originalPrice: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    currency: { type: String, default: "VND" },
    isOnSale: { type: Boolean, default: false },
    saleStartDate: { type: Date },
    saleEndDate: { type: Date },
    discountPercent: { type: Number, min: 0, max: 100 },
  },
  { _id: false }
);

// Inventory Schema
const inventorySchema = new mongoose.Schema(
  {
    stock: { type: Number, required: true, min: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    isInStock: { type: Boolean, default: true },
    reservedStock: { type: Number, default: 0 }, // Reserved for orders
  },
  { _id: false }
);

// Images Schema
const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    alt: { type: String },
    isPrimary: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

// Specifications Schema - Dynamic based on product type
const specificationsSchema = new mongoose.Schema(
  {
    // Common specs
    model: { type: String },
    partNumber: { type: String },
    warranty: { type: String }, // "2 năm", "36 tháng"
    productType: { type: String }, // "Hàng thông thường", "Hàng chính hãng", "Hàng nhập khẩu"
    weight: { type: String }, // "500g", "2.5kg"
    dimensions: { type: String }, // "300 x 200 x 50 mm"
    useCases: [{ type: String }], // ["Gaming", "Văn phòng", "Đồ họa - Kỹ thuật", "Doanh nghiệp", "Học sinh - Sinh viên"] - Common for all product types

    // CPU specific
    socket: { type: String }, // AM4, LGA1200, LGA1700
    cores: { type: Number },
    threads: { type: Number },
    baseClock: { type: String }, // "3.6 GHz"
    boostClock: { type: String }, // "4.6 GHz"
    cache: { type: String }, // "32MB"
    tdp: { type: String }, // "65W"
    cpuBrand: { type: String }, // "Intel", "AMD"
    series: { type: String }, // "Core i5", "Ryzen 5"
    generation: { type: String }, // "Intel Core thế hệ thứ 14"
    processingSpeed: { type: String }, // Multi-line text for detailed speed info
    maxTemperature: { type: String }, // "100°C"
    ramSupport: { type: String }, // Multi-line text for RAM support details
    integratedGraphics: { type: String }, // "Intel® UHD Graphics 730"
    pciePorts: { type: Number }, // 20
    pcieVersion: { type: String }, // "PCIe® 5.0 & PCIe® 4.0"

    // VGA specific
    chipset: { type: String }, // RTX 4080, RX 7800 XT
    chipsetManufacturer: { type: String }, // "NVIDIA", "AMD"
    graphicsChipSeries: { type: String }, // "GeForce RTX 50 series", "Radeon RX 7000 series"
    gpuSeries: { type: String }, // "iGame", "ROG Strix", "Gaming X"
    memory: { type: String }, // "16GB GDDR6X", "16GB GDDR7 ( 28Gbps / 128-bit )"
    memoryInterface: { type: String }, // "256-bit"
    coreClock: { type: String }, // "2210 MHz"
    memoryClock: { type: String }, // "22.4 Gbps"
    gpuClock: { type: String }, // "Base: 2407Mhz; Boost: 2572Mhz"
    cudaCores: { type: String }, // "4608 CUDA cores", "10240 Stream Processors"
    maxResolution: { type: String }, // "7680x4320"
    outputs: [{ type: String }], // ["HDMI 2.1", "DisplayPort 1.4a"]
    cooling: { type: String }, // "Tản nhiệt 3 quạt", "Dual Fan", "AIO Liquid"
    powerConnectors: { type: String }, // "2x 8-pin"
    recommendedPSU: { type: String }, // "750W", "600W"

    // RAM specific
    ramSticks: { type: Number }, // 1, 2, 4 (số thanh RAM trong bộ)
    capacity: { type: String }, // "16GB", "32GB" - dung lượng mỗi thanh
    capacityTotal: { type: String }, // "1 x 16GB", "2 x 8GB" - format hiển thị
    generation: { type: String }, // "DDR4", "DDR5"
    busSpeed: { type: String }, // "3200MHz", "5600MHz"
    speed: { type: String }, // "DDR4-3200", "DDR5-5600" - deprecated, use generation + busSpeed
    timing: { type: String }, // "22", "CL16-18-18-38"
    voltage: { type: String }, // "1.2V", "1.35V"
    formFactor: { type: String }, // "DIMM", "SO-DIMM"

    // Mainboard specific
    mbSeries: { type: String }, // "Gaming", "Pro", "Aorus"
    chipsetMB: { type: String }, // "B860", "Z790", "X670E"
    socketMB: { type: String }, // "1851", "LGA1700", "AM5"
    formFactorMB: { type: String }, // "ATX", "Micro-ATX", "Mini-ITX"
    supportedCPU: [{ type: String }], // ["Intel 12th Gen", "Intel 13th Gen"]
    memorySlots: { type: Number }, // 4
    ramType: { type: String }, // "DDR4", "DDR5"
    maxMemory: { type: String }, // "128GB", "256GB"
    ramBusSupport: { type: String }, // Multi-line text for RAM bus speeds
    storageConnectors: [{ type: String }], // ["6x SATA", "3x M.2"]
    m2Type: { type: String }, // "M.2 NVMe", "M.2 SATA", "M.2 NVMe & SATA"
    expansionSlots: [{ type: String }], // ["PCIe 5.0 x16", "PCIe 4.0 x1"]
    videoOutputs: { type: String }, // "1 x HDMI, 1 x DisplayPort, 1 x Thunderbolt 4"
    usbPorts: { type: String }, // Multi-line text for USB ports
    lan: { type: String }, // "1 x LAN 5Gb/s", "2.5Gb Ethernet"
    wireless: { type: String }, // "Wi-Fi 7 (802.11be), Bluetooth 5.4"
    audio: { type: String }, // Multi-line text for audio codec
    networkConnectors: [{ type: String }], // ["Gigabit Ethernet", "Wi-Fi 6E"] - deprecated, use lan and wireless instead

    // Storage specific
    storageType: { type: String }, // "SSD", "HDD", "NVMe SSD", "SATA SSD"
    capacity: { type: String }, // "1TB", "500GB"
    interface: { type: String }, // "SATA III", "NVMe PCIe 4.0", "M.2 NVMe"
    formFactorStorage: { type: String }, // "2.5\"", "3.5\"", "M.2 2280"
    nandType: { type: String }, // "3D-NAND", "TLC", "QLC", "MLC"
    readSpeed: { type: String }, // "7,000 MB/s", "5000MB/s"
    writeSpeed: { type: String }, // "6,000 MB/s", "3000MB/s"

    // PSU specific
    psuSeries: { type: String }, // "MAG", "RMx", "Focus"
    wattage: { type: String }, // "750W", "850W"
    efficiency: { type: String }, // "80 Plus Bronze", "80 Plus Gold", "80 Plus Platinum"
    modular: { type: String }, // "Full Modular", "Semi Modular", "Non-Modular"
    cables: { type: String }, // "1 x 24-pin Main, 2 x 8-pin (4+4) EPS, 1 x 16-pin PCIE" - Full description
    cablesArray: [{ type: String }], // ["24-pin ATX", "8-pin CPU", "6+2-pin PCIe"] - deprecated, use cables instead
    coolingFan: { type: String }, // "1 x 120 mm", "140mm"
    inputVoltage: { type: String }, // "100 - 240VAC", "115-230V"

    // Case specific
    caseName: { type: String }, // "Z20", "H510", "O11 Dynamic"
    caseType: { type: String }, // "Mid Tower", "Full Tower", "Mini Tower", "Mini ITX"
    material: { type: String }, // "Thép", "Nhôm", "Nhựa", "Thép + Nhựa"
    sidePanelMaterial: { type: String }, // "Kính cường lực", "Nhựa", "Thép"
    supportedMainboard: [{ type: String }], // ["Mini-ITX", "Micro-ATX", "ATX"]
    maxGPULength: { type: String }, // "380mm"
    maxCPUCoolerHeight: { type: String }, // "165mm", "180mm"
    maxRadiatorSize: { type: String }, // "240 mm", "360 mm"
    driveBays: [{ type: String }], // ["1 x 3.5\"", "3 x 2.5\""]
    frontPorts: [{ type: String }], // ["1 x USB 3.2", "1 x USB Type C"]
    topFanSupport: { type: String }, // "2 x 120 mm, 2 x 140 mm"
    rearFanSupport: { type: String }, // "1 x 120 mm, 1 x 92 mm"
    bottomFanSupport: { type: String }, // "2 x 120 mm, 2 x 140 mm"
    pciSlots: { type: Number }, // 4, 7

    // Cooling specific
    coolingType: { type: String }, // "Tản nước AIO", "Air Cooler", "AIO Liquid"
    socketCompatibility: [{ type: String }], // ["Intel LGA 1151-v2", "AMD AM4", "AMD AM5"]
    fanSize: { type: String }, // "3 x 360 mm", "120mm", "140mm"
    coolingMaterial: { type: String }, // "Nhôm", "Đồng", "Nhôm + Đồng"
    radiatorSize: { type: String }, // "401 x 120 x 27 mm", "240 mm", "360 mm"
    height: { type: String }, // "600 mm", "165mm"
    pumpRPM: { type: String }, // "1,200 – 2,800 ± 300 RPM"
    fanRPM: { type: String }, // "500 - 2,400 ± 250 RPM"
    airflowCFM: { type: String }, // "75.05 CFM"
    noiseLevel: { type: String }, // "31.9 dBA", "25 dB"

    // LED specific (for Case, RAM, VGA, Keyboard, Mouse, Cooling, etc.)
    hasLED: { type: Boolean, default: false }, // Whether product has LED lighting
    ledType: {
      type: String,
      enum: ["none", "RGB", "ARGB", "single-color", "other"],
      default: "none",
    }, // Type of LED: RGB, ARGB, single color, etc.

    // Monitor specific
    screenSize: { type: String }, // "27\"", "32\""
    resolution: { type: String }, // "2560x1440", "3840x2160"
    panelType: { type: String }, // "IPS", "VA", "TN", "OLED"
    refreshRate: { type: String }, // "144Hz", "165Hz"
    responseTime: { type: String }, // "1ms", "4ms"
    brightness: { type: String }, // "400 nits"
    contrast: { type: String }, // "1000:1"
    colorGamut: { type: String }, // "99% sRGB", "95% DCI-P3"
    features: [{ type: String }], // ["HDR400", "FreeSync Premium", "USB-C Hub"]

    // Custom fields for flexibility
    customSpecs: [
      {
        name: { type: String },
        value: { type: String },
      },
    ],
  },
  { _id: false }
);

// SEO Schema
const seoSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    metaTitle: { type: String },
    metaDescription: { type: String },
    metaKeywords: [{ type: String }],
    ogImage: { type: String },
  },
  { _id: false }
);

// Tags Schema
const tagSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    color: { type: String, default: "#007bff" }, // Hex color
    priority: { type: Number, default: 0 }, // Higher = shown first
  },
  { _id: false }
);

// Main Product Schema
const productSchema = new mongoose.Schema(
  {
    // Basic Information
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    barcode: { type: String },
    shortDescription: { type: String, maxlength: 500 },
    fullDescription: { type: String },

    // Relations
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    // Colors - Array of color values (e.g., ['black', 'white', 'rgb'])
    colors: [
      {
        type: String,
        enum: [
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
        ],
      },
    ],

    // Pricing & Inventory
    pricing: pricingSchema,
    inventory: inventorySchema,

    // Media
    images: [imageSchema],
    videos: [
      {
        url: { type: String },
        title: { type: String },
        isReview: { type: Boolean, default: false },
      },
    ],

    // Technical Specifications
    specifications: specificationsSchema,

    // SEO & Marketing
    seo: seoSchema,
    tags: [tagSchema],

    // Status & Visibility
    status: {
      type: String,
      enum: ["draft", "published", "discontinued", "coming-soon"],
      default: "draft",
    },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },

    // Analytics
    views: { type: Number, default: 0 },
    sales: { type: Number, default: 0 },

    // Review Stats (to be updated from review service)
    rating: {
      average: { type: Number, min: 0, max: 5, default: 0 },
      count: { type: Number, default: 0 },
    },

    // Additional Fields
    releaseDate: { type: Date },
    discontinuedDate: { type: Date },

    // Audit Fields
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for computed available stock
productSchema.virtual("inventory.availableStock").get(function () {
  return this.inventory.stock - this.inventory.reservedStock;
});

// Virtual for final price
productSchema.virtual("pricing.finalPrice").get(function () {
  if (this.pricing.isOnSale && this.pricing.salePrice) {
    return this.pricing.salePrice;
  }
  return this.pricing.originalPrice;
});

// Indexes for performance
productSchema.index({ sku: 1 });
productSchema.index({ brandId: 1 });
productSchema.index({ categoryId: 1 });
productSchema.index({ colors: 1 });
productSchema.index({ "seo.slug": 1 });
productSchema.index({ status: 1, isActive: 1 });
productSchema.index({ "pricing.isOnSale": 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ "rating.average": -1 });
productSchema.index({ sales: -1 });
productSchema.index({ "specifications.useCases": 1 }); // Index for filtering by use cases

// Text index for search
productSchema.index({
  name: "text",
  shortDescription: "text",
  "specifications.model": "text",
  "specifications.partNumber": "text",
});

module.exports = mongoose.model("Product", productSchema);
