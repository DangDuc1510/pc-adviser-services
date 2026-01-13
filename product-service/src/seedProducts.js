const mongoose = require("mongoose");
const config = require("./config/env");
const Product = require("./models/product.model");
const Brand = require("./models/brand.model");
const Category = require("./models/category.model");

// Helper function to generate slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Helper function to generate SKU
function generateSKU(brandName, categoryName, productName) {
  const brandCode = brandName.substring(0, 3).toUpperCase();
  const categoryCode = categoryName.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  return `${brandCode}-${categoryCode}-${timestamp}`;
}

// Helper function to generate random price
function randomPrice(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to get random stock
function randomStock(min = 10, max = 100) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to create image array
function createImages(productName, count = 3) {
  const images = [];
  for (let i = 1; i <= count; i++) {
    images.push({
      url: `https://via.placeholder.com/800x800?text=${encodeURIComponent(
        productName
      )}-${i}`,
      alt: `${productName} - Hình ${i}`,
      isPrimary: i === 1,
      sortOrder: i - 1,
    });
  }
  return images;
}

async function seedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGO_URI, {
      dbName: config.MONGODB_DB_NAME,
    });
    console.log("✅ Connected to MongoDB");

    // Get all brands and categories
    const brands = await Brand.find({});
    const categories = await Category.find({});

    const brandMap = new Map();
    brands.forEach((b) => brandMap.set(b.name, b._id));

    const categoryMap = new Map();
    categories.forEach((c) => categoryMap.set(c.name, c._id));

    console.log(
      `\n📦 Found ${brands.length} brands and ${categories.length} categories`
    );

    // Clear existing products
    const existingProducts = await Product.countDocuments();
    if (existingProducts > 0) {
      console.log(
        `\n⚠️  Found ${existingProducts} existing products. Clearing...`
      );
      await Product.deleteMany({});
      console.log("✅ Cleared existing products");
    }

    const products = [];
    let skuCounter = 1000;

    // ========== CPU Products ==========
    const cpuIntelCorei5 = categoryMap.get("CPU Intel Core i5");
    const cpuIntelCorei7 = categoryMap.get("CPU Intel Core i7");
    const cpuIntelCorei9 = categoryMap.get("CPU Intel Core i9");
    const cpuAmdRyzen5 = categoryMap.get("CPU AMD Ryzen 5");
    const cpuAmdRyzen7 = categoryMap.get("CPU AMD Ryzen 7");
    const cpuAmdRyzen9 = categoryMap.get("CPU AMD Ryzen 9");

    // CPU Intel
    if (cpuIntelCorei5 && brandMap.has("Intel")) {
      products.push({
        name: "Intel Core i5-14600K",
        sku: `INT-CPU-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "CPU Intel Core i5-14600K 14th Gen - 14 nhân 20 luồng, Base 3.5GHz, Boost 5.3GHz",
        fullDescription:
          "Intel Core i5-14600K là bộ xử lý thế hệ 14 mới nhất với 14 nhân (6 P-core + 8 E-core) và 20 luồng. Tốc độ cơ bản 3.5GHz, boost lên đến 5.3GHz. Hỗ trợ DDR5-5600 và DDR4-3200, tích hợp Intel UHD Graphics 770. Socket LGA1700, TDP 125W. Phù hợp cho gaming và đa nhiệm.",
        brandId: brandMap.get("Intel"),
        categoryId: cpuIntelCorei5,
        colors: ["silver"],
        pricing: {
          originalPrice: 8990000,
          salePrice: 8490000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 6,
        },
        inventory: {
          stock: randomStock(20, 50),
          lowStockThreshold: 10,
          isInStock: true,
        },
        images: createImages("Intel Core i5-14600K", 4),
        specifications: {
          model: "BX8071514600K",
          partNumber: "BX8071514600K",
          warranty: "36 tháng",
          productType: "Hàng chính hãng",
          weight: "45g",
          dimensions: "45 x 37.5 x 4.4 mm",
          useCases: ["Gaming", "Văn phòng", "Đồ họa - Kỹ thuật"],
          socket: "LGA1700",
          cores: 14,
          threads: 20,
          baseClock: "3.5 GHz",
          boostClock: "5.3 GHz",
          cache: "24MB L3",
          tdp: "125W",
          cpuBrand: "Intel",
          series: "Core i5",
          generation: "Intel Core thế hệ thứ 14",
          processingSpeed:
            "P-core: 3.5GHz (Base) / 5.3GHz (Boost)\nE-core: 2.6GHz (Base) / 4.0GHz (Boost)",
          maxTemperature: "100°C",
          ramSupport: "DDR5-5600 (Max 192GB)\nDDR4-3200 (Max 192GB)",
          integratedGraphics: "Intel® UHD Graphics 770",
          pciePorts: 20,
          pcieVersion: "PCIe® 5.0 & PCIe® 4.0",
        },
        seo: {
          slug: generateSlug("Intel Core i5-14600K"),
          metaTitle: "Intel Core i5-14600K - CPU Intel 14th Gen",
          metaDescription:
            "CPU Intel Core i5-14600K 14 nhân 20 luồng, Base 3.5GHz Boost 5.3GHz. Socket LGA1700, hỗ trợ DDR5. Phù hợp gaming và đa nhiệm.",
          metaKeywords: [
            "Intel Core i5",
            "i5-14600K",
            "CPU Intel 14th Gen",
            "LGA1700",
          ],
        },
        tags: [
          { name: "Gaming", color: "#ff6b6b", priority: 1 },
          { name: "Mới", color: "#51cf66", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: true,
      });
    }

    if (cpuIntelCorei7 && brandMap.has("Intel")) {
      products.push({
        name: "Intel Core i7-14700K",
        sku: `INT-CPU-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "CPU Intel Core i7-14700K 14th Gen - 20 nhân 28 luồng, Base 3.4GHz, Boost 5.6GHz",
        fullDescription:
          "Intel Core i7-14700K là flagship của dòng i7 thế hệ 14 với 20 nhân (8 P-core + 12 E-core) và 28 luồng. Tốc độ boost lên đến 5.6GHz, hiệu năng vượt trội cho gaming và content creation. Hỗ trợ DDR5-5600, tích hợp Intel UHD Graphics 770.",
        brandId: brandMap.get("Intel"),
        categoryId: cpuIntelCorei7,
        colors: ["silver"],
        pricing: {
          originalPrice: 12990000,
          salePrice: 12490000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 4,
        },
        inventory: {
          stock: randomStock(15, 40),
          lowStockThreshold: 10,
          isInStock: true,
        },
        images: createImages("Intel Core i7-14700K", 4),
        specifications: {
          model: "BX8071514700K",
          partNumber: "BX8071514700K",
          warranty: "36 tháng",
          productType: "Hàng chính hãng",
          weight: "45g",
          dimensions: "45 x 37.5 x 4.4 mm",
          useCases: ["Gaming", "Đồ họa - Kỹ thuật", "Doanh nghiệp"],
          socket: "LGA1700",
          cores: 20,
          threads: 28,
          baseClock: "3.4 GHz",
          boostClock: "5.6 GHz",
          cache: "33MB L3",
          tdp: "125W",
          cpuBrand: "Intel",
          series: "Core i7",
          generation: "Intel Core thế hệ thứ 14",
          processingSpeed:
            "P-core: 3.4GHz (Base) / 5.6GHz (Boost)\nE-core: 2.5GHz (Base) / 4.2GHz (Boost)",
          maxTemperature: "100°C",
          ramSupport: "DDR5-5600 (Max 192GB)\nDDR4-3200 (Max 192GB)",
          integratedGraphics: "Intel® UHD Graphics 770",
          pciePorts: 20,
          pcieVersion: "PCIe® 5.0 & PCIe® 4.0",
        },
        seo: {
          slug: generateSlug("Intel Core i7-14700K"),
          metaTitle: "Intel Core i7-14700K - CPU Intel 14th Gen High-End",
          metaDescription:
            "CPU Intel Core i7-14700K 20 nhân 28 luồng, Boost 5.6GHz. Hiệu năng cao cho gaming và content creation.",
          metaKeywords: [
            "Intel Core i7",
            "i7-14700K",
            "CPU Intel 14th Gen",
            "High-end CPU",
          ],
        },
        tags: [
          { name: "Gaming", color: "#ff6b6b", priority: 1 },
          { name: "High-End", color: "#ffd43b", priority: 2 },
          { name: "Mới", color: "#51cf66", priority: 3 },
        ],
        status: "published",
        isActive: true,
        isFeatured: true,
      });
    }

    if (cpuIntelCorei9 && brandMap.has("Intel")) {
      products.push({
        name: "Intel Core i9-14900K",
        sku: `INT-CPU-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "CPU Intel Core i9-14900K 14th Gen - 24 nhân 32 luồng, Base 3.2GHz, Boost 6.0GHz",
        fullDescription:
          "Intel Core i9-14900K là CPU flagship mạnh nhất với 24 nhân (8 P-core + 16 E-core) và 32 luồng. Tốc độ boost lên đến 6.0GHz, hiệu năng đỉnh cao cho gaming, streaming và content creation chuyên nghiệp.",
        brandId: brandMap.get("Intel"),
        categoryId: cpuIntelCorei9,
        colors: ["silver"],
        pricing: {
          originalPrice: 18990000,
          currency: "VND",
          isOnSale: false,
        },
        inventory: {
          stock: randomStock(10, 30),
          lowStockThreshold: 5,
          isInStock: true,
        },
        images: createImages("Intel Core i9-14900K", 4),
        specifications: {
          model: "BX8071514900K",
          partNumber: "BX8071514900K",
          warranty: "36 tháng",
          productType: "Hàng chính hãng",
          weight: "45g",
          dimensions: "45 x 37.5 x 4.4 mm",
          useCases: ["Gaming", "Đồ họa - Kỹ thuật", "Doanh nghiệp"],
          socket: "LGA1700",
          cores: 24,
          threads: 32,
          baseClock: "3.2 GHz",
          boostClock: "6.0 GHz",
          cache: "36MB L3",
          tdp: "125W",
          cpuBrand: "Intel",
          series: "Core i9",
          generation: "Intel Core thế hệ thứ 14",
          processingSpeed:
            "P-core: 3.2GHz (Base) / 6.0GHz (Boost)\nE-core: 2.4GHz (Base) / 4.4GHz (Boost)",
          maxTemperature: "100°C",
          ramSupport: "DDR5-5600 (Max 192GB)\nDDR4-3200 (Max 192GB)",
          integratedGraphics: "Intel® UHD Graphics 770",
          pciePorts: 20,
          pcieVersion: "PCIe® 5.0 & PCIe® 4.0",
        },
        seo: {
          slug: generateSlug("Intel Core i9-14900K"),
          metaTitle: "Intel Core i9-14900K - CPU Flagship Intel 14th Gen",
          metaDescription:
            "CPU Intel Core i9-14900K 24 nhân 32 luồng, Boost 6.0GHz. Flagship mạnh nhất cho gaming và content creation chuyên nghiệp.",
          metaKeywords: [
            "Intel Core i9",
            "i9-14900K",
            "CPU Flagship",
            "Intel 14th Gen",
          ],
        },
        tags: [
          { name: "Flagship", color: "#ff6b6b", priority: 1 },
          { name: "Gaming", color: "#ff6b6b", priority: 2 },
          { name: "Mới", color: "#51cf66", priority: 3 },
        ],
        status: "published",
        isActive: true,
        isFeatured: true,
      });
    }

    // CPU AMD
    if (cpuAmdRyzen5 && brandMap.has("AMD")) {
      products.push({
        name: "AMD Ryzen 5 7600X",
        sku: `AMD-CPU-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "CPU AMD Ryzen 5 7600X - 6 nhân 12 luồng, Base 4.7GHz, Boost 5.3GHz, Socket AM5",
        fullDescription:
          "AMD Ryzen 5 7600X là CPU thế hệ mới với kiến trúc Zen 4, 6 nhân 12 luồng. Tốc độ boost lên đến 5.3GHz, hiệu năng vượt trội cho gaming. Socket AM5, hỗ trợ DDR5, không tích hợp GPU.",
        brandId: brandMap.get("AMD"),
        categoryId: cpuAmdRyzen5,
        colors: ["silver"],
        pricing: {
          originalPrice: 7990000,
          salePrice: 7490000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 6,
        },
        inventory: {
          stock: randomStock(25, 60),
          lowStockThreshold: 10,
          isInStock: true,
        },
        images: createImages("AMD Ryzen 5 7600X", 4),
        specifications: {
          model: "100-100000593WOF",
          partNumber: "100-100000593WOF",
          warranty: "36 tháng",
          productType: "Hàng chính hãng",
          weight: "45g",
          dimensions: "40 x 40 x 6.6 mm",
          useCases: ["Gaming", "Văn phòng"],
          socket: "AM5",
          cores: 6,
          threads: 12,
          baseClock: "4.7 GHz",
          boostClock: "5.3 GHz",
          cache: "38MB (6MB L2 + 32MB L3)",
          tdp: "105W",
          cpuBrand: "AMD",
          series: "Ryzen 5",
          generation: "AMD Ryzen 7000 series",
          processingSpeed:
            "Base: 4.7GHz\nBoost: 5.3GHz (Single Core)\nMax Boost: 5.3GHz",
          maxTemperature: "95°C",
          ramSupport: "DDR5-5200 (Max 128GB)\nDual Channel",
          integratedGraphics: "Không có",
          pciePorts: 24,
          pcieVersion: "PCIe® 5.0",
        },
        seo: {
          slug: generateSlug("AMD Ryzen 5 7600X"),
          metaTitle: "AMD Ryzen 5 7600X - CPU AM5 Gaming",
          metaDescription:
            "CPU AMD Ryzen 5 7600X 6 nhân 12 luồng, Boost 5.3GHz. Socket AM5, hỗ trợ DDR5, hiệu năng gaming vượt trội.",
          metaKeywords: [
            "AMD Ryzen 5",
            "Ryzen 5 7600X",
            "CPU AM5",
            "Gaming CPU",
          ],
        },
        tags: [
          { name: "Gaming", color: "#ff6b6b", priority: 1 },
          { name: "AM5", color: "#339af0", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: false,
      });
    }

    if (cpuAmdRyzen7 && brandMap.has("AMD")) {
      products.push({
        name: "AMD Ryzen 7 7800X3D",
        sku: `AMD-CPU-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "CPU AMD Ryzen 7 7800X3D - 8 nhân 16 luồng, 3D V-Cache, Base 4.2GHz, Boost 5.0GHz",
        fullDescription:
          "AMD Ryzen 7 7800X3D là CPU gaming mạnh nhất với công nghệ 3D V-Cache 96MB. 8 nhân 16 luồng, hiệu năng gaming vượt trội nhờ bộ nhớ cache khổng lồ. Socket AM5, hỗ trợ DDR5.",
        brandId: brandMap.get("AMD"),
        categoryId: cpuAmdRyzen7,
        colors: ["silver"],
        pricing: {
          originalPrice: 13990000,
          currency: "VND",
          isOnSale: false,
        },
        inventory: {
          stock: randomStock(15, 35),
          lowStockThreshold: 5,
          isInStock: true,
        },
        images: createImages("AMD Ryzen 7 7800X3D", 4),
        specifications: {
          model: "100-100000910WOF",
          partNumber: "100-100000910WOF",
          warranty: "36 tháng",
          productType: "Hàng chính hãng",
          weight: "45g",
          dimensions: "40 x 40 x 6.6 mm",
          useCases: ["Gaming", "Đồ họa - Kỹ thuật"],
          socket: "AM5",
          cores: 8,
          threads: 16,
          baseClock: "4.2 GHz",
          boostClock: "5.0 GHz",
          cache: "104MB (8MB L2 + 96MB L3)",
          tdp: "120W",
          cpuBrand: "AMD",
          series: "Ryzen 7",
          generation: "AMD Ryzen 7000 series với 3D V-Cache",
          processingSpeed:
            "Base: 4.2GHz\nBoost: 5.0GHz (Single Core)\nMax Boost: 5.0GHz",
          maxTemperature: "89°C",
          ramSupport: "DDR5-5200 (Max 128GB)\nDual Channel",
          integratedGraphics: "Không có",
          pciePorts: 24,
          pcieVersion: "PCIe® 5.0",
        },
        seo: {
          slug: generateSlug("AMD Ryzen 7 7800X3D"),
          metaTitle: "AMD Ryzen 7 7800X3D - CPU Gaming 3D V-Cache",
          metaDescription:
            "CPU AMD Ryzen 7 7800X3D 8 nhân 16 luồng với 3D V-Cache 96MB. Hiệu năng gaming đỉnh cao, Socket AM5.",
          metaKeywords: [
            "AMD Ryzen 7",
            "Ryzen 7 7800X3D",
            "3D V-Cache",
            "Gaming CPU",
          ],
        },
        tags: [
          { name: "Gaming", color: "#ff6b6b", priority: 1 },
          { name: "3D V-Cache", color: "#ffd43b", priority: 2 },
          { name: "Best Seller", color: "#ff6b6b", priority: 3 },
        ],
        status: "published",
        isActive: true,
        isFeatured: true,
      });
    }

    if (cpuAmdRyzen9 && brandMap.has("AMD")) {
      products.push({
        name: "AMD Ryzen 9 7950X",
        sku: `AMD-CPU-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "CPU AMD Ryzen 9 7950X - 16 nhân 32 luồng, Base 4.5GHz, Boost 5.7GHz, Socket AM5",
        fullDescription:
          "AMD Ryzen 9 7950X là CPU flagship với 16 nhân 32 luồng, kiến trúc Zen 4. Tốc độ boost lên đến 5.7GHz, hiệu năng đa nhiệm cực mạnh cho content creation và workstation.",
        brandId: brandMap.get("AMD"),
        categoryId: cpuAmdRyzen9,
        colors: ["silver"],
        pricing: {
          originalPrice: 18990000,
          currency: "VND",
          isOnSale: false,
        },
        inventory: {
          stock: randomStock(8, 25),
          lowStockThreshold: 5,
          isInStock: true,
        },
        images: createImages("AMD Ryzen 9 7950X", 4),
        specifications: {
          model: "100-100000514WOF",
          partNumber: "100-100000514WOF",
          warranty: "36 tháng",
          productType: "Hàng chính hãng",
          weight: "45g",
          dimensions: "40 x 40 x 6.6 mm",
          useCases: ["Đồ họa - Kỹ thuật", "Doanh nghiệp", "Gaming"],
          socket: "AM5",
          cores: 16,
          threads: 32,
          baseClock: "4.5 GHz",
          boostClock: "5.7 GHz",
          cache: "80MB (16MB L2 + 64MB L3)",
          tdp: "170W",
          cpuBrand: "AMD",
          series: "Ryzen 9",
          generation: "AMD Ryzen 7000 series",
          processingSpeed:
            "Base: 4.5GHz\nBoost: 5.7GHz (Single Core)\nMax Boost: 5.7GHz",
          maxTemperature: "95°C",
          ramSupport: "DDR5-5200 (Max 128GB)\nDual Channel",
          integratedGraphics: "Không có",
          pciePorts: 24,
          pcieVersion: "PCIe® 5.0",
        },
        seo: {
          slug: generateSlug("AMD Ryzen 9 7950X"),
          metaTitle: "AMD Ryzen 9 7950X - CPU Flagship AM5",
          metaDescription:
            "CPU AMD Ryzen 9 7950X 16 nhân 32 luồng, Boost 5.7GHz. Flagship mạnh nhất cho content creation và workstation.",
          metaKeywords: ["AMD Ryzen 9", "Ryzen 9 7950X", "CPU Flagship", "AM5"],
        },
        tags: [
          { name: "Flagship", color: "#ff6b6b", priority: 1 },
          { name: "Content Creation", color: "#ffd43b", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: true,
      });
    }

    // ========== VGA Products ==========
    const vgaNvidiaRTX4090 = categoryMap.get("VGA NVIDIA RTX 4090");
    const vgaNvidiaRTX4080 = categoryMap.get("VGA NVIDIA RTX 4080");
    const vgaNvidiaRTX4070 = categoryMap.get("VGA NVIDIA RTX 4070");
    const vgaNvidiaRTX4060 = categoryMap.get("VGA NVIDIA RTX 4060");
    const vgaAmdRX7900 = categoryMap.get("VGA AMD RX 7900 XTX");
    const vgaAmdRX7800 = categoryMap.get("VGA AMD RX 7800 XT");

    // VGA NVIDIA
    if (vgaNvidiaRTX4090 && brandMap.has("ASUS")) {
      products.push({
        name: "ASUS ROG Strix RTX 4090 OC Edition",
        sku: `ASU-VGA-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "VGA ASUS ROG Strix RTX 4090 OC - 24GB GDDR6X, Boost 2610MHz, 3 quạt tản nhiệt",
        fullDescription:
          "ASUS ROG Strix RTX 4090 OC Edition là card đồ họa flagship với 24GB GDDR6X, tốc độ boost 2610MHz. Tản nhiệt 3 quạt Axial-tech, RGB Aura Sync. Hiệu năng 4K gaming và ray tracing cực mạnh.",
        brandId: brandMap.get("ASUS"),
        categoryId: vgaNvidiaRTX4090,
        colors: ["black", "rgb"],
        pricing: {
          originalPrice: 54990000,
          currency: "VND",
          isOnSale: false,
        },
        inventory: {
          stock: randomStock(5, 15),
          lowStockThreshold: 3,
          isInStock: true,
        },
        images: createImages("ASUS ROG Strix RTX 4090 OC", 5),
        specifications: {
          model: "ROG-STRIX-RTX4090-O24G-GAMING",
          partNumber: "90YV0IE0-M0NA00",
          warranty: "36 tháng",
          productType: "Hàng chính hãng",
          weight: "2.5kg",
          dimensions: "357.6 x 149.3 x 70.1 mm",
          useCases: ["Gaming", "Đồ họa - Kỹ thuật"],
          chipset: "RTX 4090",
          chipsetManufacturer: "NVIDIA",
          graphicsChipSeries: "GeForce RTX 40 series",
          gpuSeries: "ROG Strix",
          memory: "24GB GDDR6X",
          memoryInterface: "384-bit",
          coreClock: "2230 MHz",
          memoryClock: "21 Gbps",
          gpuClock: "Base: 2230MHz; Boost: 2610MHz",
          cudaCores: "16384 CUDA cores",
          maxResolution: "7680x4320",
          outputs: ["HDMI 2.1", "DisplayPort 1.4a x3"],
          cooling: "Tản nhiệt 3 quạt Axial-tech",
          powerConnectors: "1x 16-pin (12VHPWR)",
          recommendedPSU: "850W",
          hasLED: true,
          ledType: "ARGB",
        },
        seo: {
          slug: generateSlug("ASUS ROG Strix RTX 4090 OC"),
          metaTitle: "ASUS ROG Strix RTX 4090 OC - VGA Flagship 24GB",
          metaDescription:
            "VGA ASUS ROG Strix RTX 4090 OC 24GB GDDR6X, Boost 2610MHz. Flagship gaming, 4K ray tracing cực mạnh.",
          metaKeywords: ["RTX 4090", "ASUS ROG Strix", "VGA Flagship", "24GB"],
        },
        tags: [
          { name: "Flagship", color: "#ff6b6b", priority: 1 },
          { name: "Gaming", color: "#ff6b6b", priority: 2 },
          { name: "RGB", color: "#339af0", priority: 3 },
        ],
        status: "published",
        isActive: true,
        isFeatured: true,
      });
    }

    if (vgaNvidiaRTX4080 && brandMap.has("MSI")) {
      products.push({
        name: "MSI GeForce RTX 4080 SUPER Gaming X Trio",
        sku: `MSI-VGA-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "VGA MSI RTX 4080 SUPER - 16GB GDDR6X, Boost 2640MHz, 3 quạt TORX Fan 5.0",
        fullDescription:
          "MSI GeForce RTX 4080 SUPER Gaming X Trio với 16GB GDDR6X, tốc độ boost 2640MHz. Tản nhiệt 3 quạt TORX Fan 5.0, RGB Mystic Light. Hiệu năng 4K gaming và DLSS 3.5.",
        brandId: brandMap.get("MSI"),
        categoryId: vgaNvidiaRTX4080,
        colors: ["black", "rgb"],
        pricing: {
          originalPrice: 34990000,
          salePrice: 32990000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 6,
        },
        inventory: {
          stock: randomStock(10, 30),
          lowStockThreshold: 5,
          isInStock: true,
        },
        images: createImages("MSI RTX 4080 SUPER Gaming X Trio", 5),
        specifications: {
          model: "RTX 4080 SUPER 16G GAMING X TRIO",
          partNumber: "912-V513-001",
          warranty: "36 tháng",
          productType: "Hàng chính hãng",
          weight: "1.8kg",
          dimensions: "337 x 140 x 77 mm",
          useCases: ["Gaming", "Đồ họa - Kỹ thuật"],
          chipset: "RTX 4080 SUPER",
          chipsetManufacturer: "NVIDIA",
          graphicsChipSeries: "GeForce RTX 40 series",
          gpuSeries: "Gaming X Trio",
          memory: "16GB GDDR6X",
          memoryInterface: "256-bit",
          coreClock: "2295 MHz",
          memoryClock: "23 Gbps",
          gpuClock: "Base: 2295MHz; Boost: 2640MHz",
          cudaCores: "10240 CUDA cores",
          maxResolution: "7680x4320",
          outputs: ["HDMI 2.1", "DisplayPort 1.4a x3"],
          cooling: "Tản nhiệt 3 quạt TORX Fan 5.0",
          powerConnectors: "1x 16-pin (12VHPWR)",
          recommendedPSU: "750W",
          hasLED: true,
          ledType: "RGB",
        },
        seo: {
          slug: generateSlug("MSI RTX 4080 SUPER Gaming X Trio"),
          metaTitle: "MSI RTX 4080 SUPER Gaming X Trio - VGA 16GB",
          metaDescription:
            "VGA MSI RTX 4080 SUPER 16GB GDDR6X, Boost 2640MHz. 4K gaming, DLSS 3.5, tản nhiệt 3 quạt.",
          metaKeywords: [
            "RTX 4080 SUPER",
            "MSI Gaming X Trio",
            "VGA 16GB",
            "Gaming",
          ],
        },
        tags: [
          { name: "Gaming", color: "#ff6b6b", priority: 1 },
          { name: "RGB", color: "#339af0", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: true,
      });
    }

    if (vgaNvidiaRTX4070 && brandMap.has("Gigabyte")) {
      products.push({
        name: "Gigabyte AORUS RTX 4070 SUPER Master",
        sku: `GIG-VGA-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "VGA Gigabyte AORUS RTX 4070 SUPER - 12GB GDDR6X, Boost 2610MHz, LCD Edge View",
        fullDescription:
          "Gigabyte AORUS RTX 4070 SUPER Master với 12GB GDDR6X, tốc độ boost 2610MHz. Tản nhiệt 3 quạt, màn hình LCD Edge View hiển thị thông tin. RGB Fusion 2.0.",
        brandId: brandMap.get("Gigabyte"),
        categoryId: vgaNvidiaRTX4070,
        colors: ["black", "rgb"],
        pricing: {
          originalPrice: 24990000,
          salePrice: 23990000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 4,
        },
        inventory: {
          stock: randomStock(15, 40),
          lowStockThreshold: 10,
          isInStock: true,
        },
        images: createImages("Gigabyte AORUS RTX 4070 SUPER Master", 5),
        specifications: {
          model: "GV-N407SAORUS M-12GD",
          partNumber: "GV-N407SAORUS M-12GD",
          warranty: "36 tháng",
          productType: "Hàng chính hãng",
          weight: "1.5kg",
          dimensions: "329 x 136 x 70 mm",
          useCases: ["Gaming", "Văn phòng"],
          chipset: "RTX 4070 SUPER",
          chipsetManufacturer: "NVIDIA",
          graphicsChipSeries: "GeForce RTX 40 series",
          gpuSeries: "AORUS Master",
          memory: "12GB GDDR6X",
          memoryInterface: "192-bit",
          coreClock: "2340 MHz",
          memoryClock: "21 Gbps",
          gpuClock: "Base: 2340MHz; Boost: 2610MHz",
          cudaCores: "7168 CUDA cores",
          maxResolution: "7680x4320",
          outputs: ["HDMI 2.1", "DisplayPort 1.4a x3"],
          cooling: "Tản nhiệt 3 quạt",
          powerConnectors: "1x 16-pin (12VHPWR)",
          recommendedPSU: "650W",
          hasLED: true,
          ledType: "ARGB",
        },
        seo: {
          slug: generateSlug("Gigabyte AORUS RTX 4070 SUPER Master"),
          metaTitle: "Gigabyte AORUS RTX 4070 SUPER Master - VGA 12GB",
          metaDescription:
            "VGA Gigabyte AORUS RTX 4070 SUPER 12GB GDDR6X, Boost 2610MHz. LCD Edge View, RGB Fusion 2.0.",
          metaKeywords: [
            "RTX 4070 SUPER",
            "Gigabyte AORUS",
            "VGA 12GB",
            "Gaming",
          ],
        },
        tags: [
          { name: "Gaming", color: "#ff6b6b", priority: 1 },
          { name: "LCD Display", color: "#339af0", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: false,
      });
    }

    if (vgaNvidiaRTX4060 && brandMap.has("ASUS")) {
      products.push({
        name: "ASUS Dual RTX 4060 OC Edition",
        sku: `ASU-VGA-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "VGA ASUS Dual RTX 4060 OC - 8GB GDDR6, Boost 2535MHz, 2 quạt Axial-tech",
        fullDescription:
          "ASUS Dual RTX 4060 OC Edition với 8GB GDDR6, tốc độ boost 2535MHz. Tản nhiệt 2 quạt Axial-tech, thiết kế compact. Phù hợp cho 1080p và 1440p gaming.",
        brandId: brandMap.get("ASUS"),
        categoryId: vgaNvidiaRTX4060,
        colors: ["black"],
        pricing: {
          originalPrice: 11990000,
          salePrice: 10990000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 8,
        },
        inventory: {
          stock: randomStock(20, 50),
          lowStockThreshold: 10,
          isInStock: true,
        },
        images: createImages("ASUS Dual RTX 4060 OC", 4),
        specifications: {
          model: "DUAL-RTX4060-O8G",
          partNumber: "90YV0IE1-M0NA00",
          warranty: "36 tháng",
          productType: "Hàng chính hãng",
          weight: "0.8kg",
          dimensions: "227.2 x 123.24 x 49.6 mm",
          useCases: ["Gaming", "Văn phòng", "Học sinh - Sinh viên"],
          chipset: "RTX 4060",
          chipsetManufacturer: "NVIDIA",
          graphicsChipSeries: "GeForce RTX 40 series",
          gpuSeries: "Dual",
          memory: "8GB GDDR6",
          memoryInterface: "128-bit",
          coreClock: "1830 MHz",
          memoryClock: "16 Gbps",
          gpuClock: "Base: 1830MHz; Boost: 2535MHz",
          cudaCores: "3072 CUDA cores",
          maxResolution: "7680x4320",
          outputs: ["HDMI 2.1", "DisplayPort 1.4a x3"],
          cooling: "Tản nhiệt 2 quạt Axial-tech",
          powerConnectors: "1x 8-pin",
          recommendedPSU: "550W",
          hasLED: false,
          ledType: "none",
        },
        seo: {
          slug: generateSlug("ASUS Dual RTX 4060 OC"),
          metaTitle: "ASUS Dual RTX 4060 OC - VGA 8GB Budget",
          metaDescription:
            "VGA ASUS Dual RTX 4060 OC 8GB GDDR6, Boost 2535MHz. Phù hợp 1080p/1440p gaming, giá tốt.",
          metaKeywords: ["RTX 4060", "ASUS Dual", "VGA 8GB", "Budget Gaming"],
        },
        tags: [
          { name: "Budget", color: "#51cf66", priority: 1 },
          { name: "Gaming", color: "#ff6b6b", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: false,
      });
    }

    // VGA AMD
    if (vgaAmdRX7900 && brandMap.has("ASUS")) {
      products.push({
        name: "ASUS ROG Strix RX 7900 XTX OC Edition",
        sku: `ASU-VGA-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "VGA ASUS ROG Strix RX 7900 XTX OC - 24GB GDDR6, Boost 2615MHz, 3 quạt Axial-tech",
        fullDescription:
          "ASUS ROG Strix RX 7900 XTX OC Edition là card đồ họa AMD flagship với 24GB GDDR6, tốc độ boost 2615MHz. Tản nhiệt 3 quạt Axial-tech, RGB Aura Sync. Hiệu năng 4K gaming và ray tracing.",
        brandId: brandMap.get("ASUS"),
        categoryId: vgaAmdRX7900,
        colors: ["black", "rgb"],
        pricing: {
          originalPrice: 34990000,
          currency: "VND",
          isOnSale: false,
        },
        inventory: {
          stock: randomStock(8, 20),
          lowStockThreshold: 5,
          isInStock: true,
        },
        images: createImages("ASUS ROG Strix RX 7900 XTX OC", 5),
        specifications: {
          model: "ROG-STRIX-RX7900XTX-O24G-GAMING",
          partNumber: "90YV0IE2-M0NA00",
          warranty: "36 tháng",
          productType: "Hàng chính hãng",
          weight: "2.2kg",
          dimensions: "357.6 x 149.3 x 70.1 mm",
          useCases: ["Gaming", "Đồ họa - Kỹ thuật"],
          chipset: "RX 7900 XTX",
          chipsetManufacturer: "AMD",
          graphicsChipSeries: "Radeon RX 7000 series",
          gpuSeries: "ROG Strix",
          memory: "24GB GDDR6",
          memoryInterface: "384-bit",
          coreClock: "2000 MHz",
          memoryClock: "20 Gbps",
          gpuClock: "Base: 2000MHz; Boost: 2615MHz",
          cudaCores: "6144 Stream Processors",
          maxResolution: "7680x4320",
          outputs: ["HDMI 2.1", "DisplayPort 2.1 x3"],
          cooling: "Tản nhiệt 3 quạt Axial-tech",
          powerConnectors: "2x 8-pin",
          recommendedPSU: "800W",
          hasLED: true,
          ledType: "ARGB",
        },
        seo: {
          slug: generateSlug("ASUS ROG Strix RX 7900 XTX OC"),
          metaTitle: "ASUS ROG Strix RX 7900 XTX OC - VGA AMD 24GB",
          metaDescription:
            "VGA ASUS ROG Strix RX 7900 XTX OC 24GB GDDR6, Boost 2615MHz. Flagship AMD, 4K gaming.",
          metaKeywords: ["RX 7900 XTX", "ASUS ROG Strix", "VGA AMD", "24GB"],
        },
        tags: [
          { name: "Flagship", color: "#ff6b6b", priority: 1 },
          { name: "Gaming", color: "#ff6b6b", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: true,
      });
    }

    if (vgaAmdRX7800 && brandMap.has("MSI")) {
      products.push({
        name: "MSI Radeon RX 7800 XT Gaming X Trio",
        sku: `MSI-VGA-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "VGA MSI RX 7800 XT - 16GB GDDR6, Boost 2565MHz, 3 quạt TORX Fan 5.0",
        fullDescription:
          "MSI Radeon RX 7800 XT Gaming X Trio với 16GB GDDR6, tốc độ boost 2565MHz. Tản nhiệt 3 quạt TORX Fan 5.0, RGB Mystic Light. Hiệu năng 1440p và 4K gaming.",
        brandId: brandMap.get("MSI"),
        categoryId: vgaAmdRX7800,
        colors: ["black", "rgb"],
        pricing: {
          originalPrice: 19990000,
          salePrice: 18990000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 5,
        },
        inventory: {
          stock: randomStock(12, 35),
          lowStockThreshold: 8,
          isInStock: true,
        },
        images: createImages("MSI RX 7800 XT Gaming X Trio", 5),
        specifications: {
          model: "RX 7800 XT 16G GAMING X TRIO",
          partNumber: "912-V513-002",
          warranty: "36 tháng",
          productType: "Hàng chính hãng",
          weight: "1.6kg",
          dimensions: "337 x 140 x 77 mm",
          useCases: ["Gaming", "Văn phòng"],
          chipset: "RX 7800 XT",
          chipsetManufacturer: "AMD",
          graphicsChipSeries: "Radeon RX 7000 series",
          gpuSeries: "Gaming X Trio",
          memory: "16GB GDDR6",
          memoryInterface: "256-bit",
          coreClock: "2124 MHz",
          memoryClock: "19.5 Gbps",
          gpuClock: "Base: 2124MHz; Boost: 2565MHz",
          cudaCores: "3840 Stream Processors",
          maxResolution: "7680x4320",
          outputs: ["HDMI 2.1", "DisplayPort 2.1 x3"],
          cooling: "Tản nhiệt 3 quạt TORX Fan 5.0",
          powerConnectors: "2x 8-pin",
          recommendedPSU: "700W",
          hasLED: true,
          ledType: "RGB",
        },
        seo: {
          slug: generateSlug("MSI RX 7800 XT Gaming X Trio"),
          metaTitle: "MSI RX 7800 XT Gaming X Trio - VGA 16GB",
          metaDescription:
            "VGA MSI RX 7800 XT 16GB GDDR6, Boost 2565MHz. 1440p/4K gaming, tản nhiệt 3 quạt.",
          metaKeywords: [
            "RX 7800 XT",
            "MSI Gaming X Trio",
            "VGA 16GB",
            "Gaming",
          ],
        },
        tags: [
          { name: "Gaming", color: "#ff6b6b", priority: 1 },
          { name: "Best Value", color: "#51cf66", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: false,
      });
    }

    // ========== RAM Products ==========
    const ramDdr4Desktop = categoryMap.get("RAM DDR4 Desktop");
    const ramDdr5Desktop = categoryMap.get("RAM DDR5 Desktop");
    const ramDdr43200 = categoryMap.get("RAM DDR4 3200MHz");
    const ramDdr55600 = categoryMap.get("RAM DDR5 5600MHz");

    // RAM DDR4
    if (ramDdr43200 && brandMap.has("Corsair")) {
      products.push({
        name: "Corsair Vengeance RGB Pro 32GB (2x16GB) DDR4 3200MHz",
        sku: `COR-RAM-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "RAM Corsair Vengeance RGB Pro 32GB DDR4 3200MHz - 2 thanh 16GB, RGB, CL16",
        fullDescription:
          "Corsair Vengeance RGB Pro 32GB (2x16GB) DDR4 3200MHz với RGB lighting, timing CL16-18-18-36. Tương thích với iCUE software, hiệu năng ổn định cho gaming và overclock.",
        brandId: brandMap.get("Corsair"),
        categoryId: ramDdr43200,
        colors: ["black", "rgb"],
        pricing: {
          originalPrice: 3990000,
          salePrice: 3690000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 8,
        },
        inventory: {
          stock: randomStock(30, 80),
          lowStockThreshold: 15,
          isInStock: true,
        },
        images: createImages("Corsair Vengeance RGB Pro 32GB DDR4", 4),
        specifications: {
          model: "CMW32GX4M2E3200C16",
          partNumber: "CMW32GX4M2E3200C16",
          warranty: "Bảo hành trọn đời",
          productType: "Hàng chính hãng",
          weight: "80g",
          dimensions: "133.35 x 51.5 x 8.5 mm",
          useCases: ["Gaming", "Văn phòng", "Đồ họa - Kỹ thuật"],
          ramSticks: 2,
          capacity: "16GB",
          capacityTotal: "2 x 16GB",
          generation: "DDR4",
          busSpeed: "3200MHz",
          timing: "CL16-18-18-36",
          voltage: "1.35V",
          formFactor: "DIMM",
          hasLED: true,
          ledType: "RGB",
        },
        seo: {
          slug: generateSlug("Corsair Vengeance RGB Pro 32GB DDR4 3200MHz"),
          metaTitle: "Corsair Vengeance RGB Pro 32GB DDR4 3200MHz - RAM RGB",
          metaDescription:
            "RAM Corsair Vengeance RGB Pro 32GB (2x16GB) DDR4 3200MHz, RGB, CL16. Tương thích iCUE, hiệu năng gaming.",
          metaKeywords: [
            "Corsair Vengeance",
            "DDR4 3200MHz",
            "RAM RGB",
            "32GB",
          ],
        },
        tags: [
          { name: "RGB", color: "#339af0", priority: 1 },
          { name: "Gaming", color: "#ff6b6b", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: false,
      });
    }

    // RAM DDR5
    if (ramDdr55600 && brandMap.has("G.Skill")) {
      products.push({
        name: "G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5 5600MHz",
        sku: `GSK-RAM-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "RAM G.Skill Trident Z5 RGB 32GB DDR5 5600MHz - 2 thanh 16GB, RGB, CL36",
        fullDescription:
          "G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5 5600MHz với RGB lighting, timing CL36-36-36-89. Thiết kế aluminum heatspreader, hiệu năng cao cho Intel 12th/13th/14th Gen và AMD AM5.",
        brandId: brandMap.get("G.Skill"),
        categoryId: ramDdr55600,
        colors: ["black", "rgb"],
        pricing: {
          originalPrice: 5990000,
          salePrice: 5490000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 8,
        },
        inventory: {
          stock: randomStock(25, 60),
          lowStockThreshold: 12,
          isInStock: true,
        },
        images: createImages("G.Skill Trident Z5 RGB 32GB DDR5", 4),
        specifications: {
          model: "F5-5600J3636C16GX2-TZ5RK",
          partNumber: "F5-5600J3636C16GX2-TZ5RK",
          warranty: "Bảo hành trọn đời",
          productType: "Hàng chính hãng",
          weight: "85g",
          dimensions: "133.35 x 51.5 x 8.5 mm",
          useCases: ["Gaming", "Đồ họa - Kỹ thuật", "Doanh nghiệp"],
          ramSticks: 2,
          capacity: "16GB",
          capacityTotal: "2 x 16GB",
          generation: "DDR5",
          busSpeed: "5600MHz",
          timing: "CL36-36-36-89",
          voltage: "1.25V",
          formFactor: "DIMM",
          hasLED: true,
          ledType: "RGB",
        },
        seo: {
          slug: generateSlug("G.Skill Trident Z5 RGB 32GB DDR5 5600MHz"),
          metaTitle: "G.Skill Trident Z5 RGB 32GB DDR5 5600MHz - RAM RGB",
          metaDescription:
            "RAM G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5 5600MHz, RGB, CL36. Tương thích Intel 12th/13th/14th Gen và AMD AM5.",
          metaKeywords: [
            "G.Skill Trident Z5",
            "DDR5 5600MHz",
            "RAM RGB",
            "32GB",
          ],
        },
        tags: [
          { name: "RGB", color: "#339af0", priority: 1 },
          { name: "DDR5", color: "#ffd43b", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: true,
      });
    }

    // ========== Mainboard Products ==========
    const mbIntelZ790 = categoryMap.get("Mainboard Intel Z790");
    const mbIntelB760 = categoryMap.get("Mainboard Intel B760");
    const mbAmdX670E = categoryMap.get("Mainboard AMD X670E");
    const mbAmdB650 = categoryMap.get("Mainboard AMD B650");

    // Mainboard Intel
    if (mbIntelZ790 && brandMap.has("ASUS")) {
      products.push({
        name: "ASUS ROG Strix Z790-E Gaming WiFi",
        sku: `ASU-MB-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "Mainboard ASUS ROG Strix Z790-E - Socket LGA1700, DDR5, WiFi 6E, PCIe 5.0",
        fullDescription:
          "ASUS ROG Strix Z790-E Gaming WiFi hỗ trợ Intel 12th/13th/14th Gen, socket LGA1700. DDR5-6400+, PCIe 5.0 x16, WiFi 6E, Bluetooth 5.3. Tản nhiệt VRM mạnh mẽ, RGB Aura Sync.",
        brandId: brandMap.get("ASUS"),
        categoryId: mbIntelZ790,
        colors: ["black", "rgb"],
        pricing: {
          originalPrice: 9990000,
          salePrice: 9490000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 5,
        },
        inventory: {
          stock: randomStock(15, 40),
          lowStockThreshold: 8,
          isInStock: true,
        },
        images: createImages("ASUS ROG Strix Z790-E Gaming", 5),
        specifications: {
          model: "ROG STRIX Z790-E GAMING WIFI",
          partNumber: "90MB1A00-M0EAY0",
          warranty: "36 tháng",
          productType: "Hàng chính hãng",
          weight: "1.2kg",
          dimensions: "305 x 244 mm",
          useCases: ["Gaming", "Đồ họa - Kỹ thuật"],
          mbSeries: "ROG Strix",
          chipsetMB: "Z790",
          socketMB: "LGA1700",
          formFactorMB: "ATX",
          supportedCPU: ["Intel 12th Gen", "Intel 13th Gen", "Intel 14th Gen"],
          memorySlots: 4,
          ramType: "DDR5",
          maxMemory: "192GB",
          ramBusSupport: "DDR5-6400+ (OC)\nDDR5-5600 (JEDEC)",
          storageConnectors: ["6x SATA 6Gb/s", "5x M.2"],
          m2Type: "M.2 NVMe & SATA",
          expansionSlots: ["PCIe 5.0 x16", "PCIe 4.0 x16", "PCIe 4.0 x1 x2"],
          videoOutputs: "1 x HDMI 2.1, 1 x DisplayPort 1.4",
          usbPorts:
            "USB 3.2 Gen 2x2 Type-C (Front)\nUSB 3.2 Gen 2 Type-A x2\nUSB 3.2 Gen 1 Type-A x4\nUSB 2.0 x4",
          lan: "1 x Intel 2.5Gb Ethernet",
          wireless: "Wi-Fi 6E (802.11ax), Bluetooth 5.3",
          audio: "ROG SupremeFX 7.1 Surround Sound High Definition Audio CODEC",
          hasLED: true,
          ledType: "ARGB",
        },
        seo: {
          slug: generateSlug("ASUS ROG Strix Z790-E Gaming WiFi"),
          metaTitle: "ASUS ROG Strix Z790-E Gaming WiFi - Mainboard Intel",
          metaDescription:
            "Mainboard ASUS ROG Strix Z790-E Socket LGA1700, DDR5-6400+, PCIe 5.0, WiFi 6E. Hỗ trợ Intel 12th/13th/14th Gen.",
          metaKeywords: ["ASUS ROG Strix", "Z790", "LGA1700", "DDR5"],
        },
        tags: [
          { name: "Gaming", color: "#ff6b6b", priority: 1 },
          { name: "RGB", color: "#339af0", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: true,
      });
    }

    if (mbIntelB760 && brandMap.has("MSI")) {
      products.push({
        name: "MSI MAG B760 Tomahawk WiFi",
        sku: `MSI-MB-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "Mainboard MSI MAG B760 Tomahawk - Socket LGA1700, DDR5, WiFi 6E",
        fullDescription:
          "MSI MAG B760 Tomahawk WiFi hỗ trợ Intel 12th/13th/14th Gen, socket LGA1700. DDR5-5600+, PCIe 4.0, WiFi 6E. Tản nhiệt VRM tốt, giá hợp lý.",
        brandId: brandMap.get("MSI"),
        categoryId: mbIntelB760,
        colors: ["black"],
        pricing: {
          originalPrice: 5990000,
          salePrice: 5490000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 8,
        },
        inventory: {
          stock: randomStock(20, 50),
          lowStockThreshold: 10,
          isInStock: true,
        },
        images: createImages("MSI MAG B760 Tomahawk WiFi", 4),
        specifications: {
          model: "MAG B760 TOMAHAWK WIFI",
          partNumber: "7D96-001R",
          warranty: "36 tháng",
          productType: "Hàng chính hãng",
          weight: "1.0kg",
          dimensions: "305 x 244 mm",
          useCases: ["Gaming", "Văn phòng"],
          mbSeries: "MAG",
          chipsetMB: "B760",
          socketMB: "LGA1700",
          formFactorMB: "ATX",
          supportedCPU: ["Intel 12th Gen", "Intel 13th Gen", "Intel 14th Gen"],
          memorySlots: 4,
          ramType: "DDR5",
          maxMemory: "192GB",
          ramBusSupport: "DDR5-5600+ (OC)\nDDR5-4800 (JEDEC)",
          storageConnectors: ["6x SATA 6Gb/s", "4x M.2"],
          m2Type: "M.2 NVMe & SATA",
          expansionSlots: ["PCIe 4.0 x16", "PCIe 4.0 x1 x2"],
          videoOutputs: "1 x HDMI 2.1, 1 x DisplayPort 1.4",
          usbPorts:
            "USB 3.2 Gen 2 Type-C (Front)\nUSB 3.2 Gen 1 Type-A x4\nUSB 2.0 x4",
          lan: "1 x Realtek 2.5Gb Ethernet",
          wireless: "Wi-Fi 6E (802.11ax), Bluetooth 5.3",
          audio: "Realtek ALC897 Codec",
          hasLED: false,
          ledType: "none",
        },
        seo: {
          slug: generateSlug("MSI MAG B760 Tomahawk WiFi"),
          metaTitle: "MSI MAG B760 Tomahawk WiFi - Mainboard Intel",
          metaDescription:
            "Mainboard MSI MAG B760 Tomahawk Socket LGA1700, DDR5-5600+, PCIe 4.0, WiFi 6E. Giá tốt, hiệu năng ổn định.",
          metaKeywords: ["MSI MAG", "B760", "LGA1700", "DDR5"],
        },
        tags: [
          { name: "Gaming", color: "#ff6b6b", priority: 1 },
          { name: "Best Value", color: "#51cf66", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: false,
      });
    }

    // Mainboard AMD
    if (mbAmdX670E && brandMap.has("ASUS")) {
      products.push({
        name: "ASUS ROG Crosshair X670E Hero",
        sku: `ASU-MB-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "Mainboard ASUS ROG Crosshair X670E Hero - Socket AM5, DDR5, PCIe 5.0",
        fullDescription:
          "ASUS ROG Crosshair X670E Hero hỗ trợ AMD Ryzen 7000 series, socket AM5. DDR5-6400+, PCIe 5.0 x16 và M.2, WiFi 6E. Flagship cho overclocking và gaming.",
        brandId: brandMap.get("ASUS"),
        categoryId: mbAmdX670E,
        colors: ["black", "rgb"],
        pricing: {
          originalPrice: 12990000,
          currency: "VND",
          isOnSale: false,
        },
        inventory: {
          stock: randomStock(10, 25),
          lowStockThreshold: 5,
          isInStock: true,
        },
        images: createImages("ASUS ROG Crosshair X670E Hero", 5),
        specifications: {
          model: "ROG CROSSHAIR X670E HERO",
          partNumber: "90MB1B00-M0EAY0",
          warranty: "36 tháng",
          productType: "Hàng chính hãng",
          weight: "1.3kg",
          dimensions: "305 x 244 mm",
          useCases: ["Gaming", "Đồ họa - Kỹ thuật"],
          mbSeries: "ROG Crosshair",
          chipsetMB: "X670E",
          socketMB: "AM5",
          formFactorMB: "ATX",
          supportedCPU: ["AMD Ryzen 7000 series"],
          memorySlots: 4,
          ramType: "DDR5",
          maxMemory: "128GB",
          ramBusSupport: "DDR5-6400+ (OC)\nDDR5-5200 (JEDEC)",
          storageConnectors: ["8x SATA 6Gb/s", "5x M.2"],
          m2Type: "M.2 NVMe & SATA",
          expansionSlots: ["PCIe 5.0 x16", "PCIe 4.0 x16", "PCIe 4.0 x1 x2"],
          videoOutputs: "1 x HDMI 2.1, 1 x DisplayPort 1.4",
          usbPorts:
            "USB 3.2 Gen 2x2 Type-C (Front)\nUSB 3.2 Gen 2 Type-A x4\nUSB 3.2 Gen 1 Type-A x4\nUSB 2.0 x4",
          lan: "1 x Marvell 10Gb Ethernet",
          wireless: "Wi-Fi 6E (802.11ax), Bluetooth 5.3",
          audio: "ROG SupremeFX 7.1 Surround Sound High Definition Audio CODEC",
          hasLED: true,
          ledType: "ARGB",
        },
        seo: {
          slug: generateSlug("ASUS ROG Crosshair X670E Hero"),
          metaTitle: "ASUS ROG Crosshair X670E Hero - Mainboard AMD Flagship",
          metaDescription:
            "Mainboard ASUS ROG Crosshair X670E Hero Socket AM5, DDR5-6400+, PCIe 5.0. Flagship cho AMD Ryzen 7000 series.",
          metaKeywords: ["ASUS ROG Crosshair", "X670E", "AM5", "DDR5"],
        },
        tags: [
          { name: "Flagship", color: "#ff6b6b", priority: 1 },
          { name: "Gaming", color: "#ff6b6b", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: true,
      });
    }

    if (mbAmdB650 && brandMap.has("MSI")) {
      products.push({
        name: "MSI MAG B650 Tomahawk WiFi",
        sku: `MSI-MB-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "Mainboard MSI MAG B650 Tomahawk - Socket AM5, DDR5, WiFi 6E",
        fullDescription:
          "MSI MAG B650 Tomahawk WiFi hỗ trợ AMD Ryzen 7000 series, socket AM5. DDR5-5600+, PCIe 4.0, WiFi 6E. Tản nhiệt tốt, giá hợp lý.",
        brandId: brandMap.get("MSI"),
        categoryId: mbAmdB650,
        colors: ["black"],
        pricing: {
          originalPrice: 5990000,
          salePrice: 5490000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 8,
        },
        inventory: {
          stock: randomStock(18, 45),
          lowStockThreshold: 10,
          isInStock: true,
        },
        images: createImages("MSI MAG B650 Tomahawk WiFi", 4),
        specifications: {
          model: "MAG B650 TOMAHAWK WIFI",
          partNumber: "7D75-001R",
          warranty: "36 tháng",
          productType: "Hàng chính hãng",
          weight: "1.0kg",
          dimensions: "305 x 244 mm",
          useCases: ["Gaming", "Văn phòng"],
          mbSeries: "MAG",
          chipsetMB: "B650",
          socketMB: "AM5",
          formFactorMB: "ATX",
          supportedCPU: ["AMD Ryzen 7000 series"],
          memorySlots: 4,
          ramType: "DDR5",
          maxMemory: "128GB",
          ramBusSupport: "DDR5-5600+ (OC)\nDDR5-5200 (JEDEC)",
          storageConnectors: ["6x SATA 6Gb/s", "4x M.2"],
          m2Type: "M.2 NVMe & SATA",
          expansionSlots: ["PCIe 4.0 x16", "PCIe 4.0 x1 x2"],
          videoOutputs: "1 x HDMI 2.1, 1 x DisplayPort 1.4",
          usbPorts:
            "USB 3.2 Gen 2 Type-C (Front)\nUSB 3.2 Gen 1 Type-A x4\nUSB 2.0 x4",
          lan: "1 x Realtek 2.5Gb Ethernet",
          wireless: "Wi-Fi 6E (802.11ax), Bluetooth 5.3",
          audio: "Realtek ALC897 Codec",
          hasLED: false,
          ledType: "none",
        },
        seo: {
          slug: generateSlug("MSI MAG B650 Tomahawk WiFi"),
          metaTitle: "MSI MAG B650 Tomahawk WiFi - Mainboard AMD",
          metaDescription:
            "Mainboard MSI MAG B650 Tomahawk Socket AM5, DDR5-5600+, PCIe 4.0, WiFi 6E. Giá tốt cho AMD Ryzen 7000.",
          metaKeywords: ["MSI MAG", "B650", "AM5", "DDR5"],
        },
        tags: [
          { name: "Gaming", color: "#ff6b6b", priority: 1 },
          { name: "Best Value", color: "#51cf66", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: false,
      });
    }

    // ========== Storage Products ==========
    const storageSSDNVMe = categoryMap.get("Storage SSD NVMe M.2");
    const storageSSDSATA = categoryMap.get("Storage SSD SATA");
    const storageHDDDesktop = categoryMap.get("Storage HDD Desktop");

    // SSD NVMe
    if (storageSSDNVMe && brandMap.has("Samsung")) {
      products.push({
        name: "Samsung 990 PRO 2TB NVMe M.2 SSD",
        sku: `SAM-STR-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "SSD Samsung 990 PRO 2TB NVMe M.2 - Đọc 7450MB/s, Ghi 6900MB/s, PCIe 4.0",
        fullDescription:
          "Samsung 990 PRO 2TB NVMe M.2 SSD với tốc độ đọc 7450MB/s và ghi 6900MB/s. PCIe 4.0 x4, controller Samsung Pascal, NAND V-NAND 3-bit MLC. Hiệu năng cực cao cho gaming và content creation.",
        brandId: brandMap.get("Samsung"),
        categoryId: storageSSDNVMe,
        colors: ["black"],
        pricing: {
          originalPrice: 6990000,
          salePrice: 6490000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 7,
        },
        inventory: {
          stock: randomStock(25, 60),
          lowStockThreshold: 12,
          isInStock: true,
        },
        images: createImages("Samsung 990 PRO 2TB NVMe", 4),
        specifications: {
          model: "MZ-V9P2T0BW",
          partNumber: "MZ-V9P2T0BW",
          warranty: "60 tháng",
          productType: "Hàng chính hãng",
          weight: "8g",
          dimensions: "80 x 22 x 2.38 mm",
          useCases: ["Gaming", "Đồ họa - Kỹ thuật", "Doanh nghiệp"],
          storageType: "NVMe SSD",
          capacity: "2TB",
          interface: "NVMe PCIe 4.0 x4",
          formFactorStorage: "M.2 2280",
          nandType: "V-NAND 3-bit MLC",
          readSpeed: "7450 MB/s",
          writeSpeed: "6900 MB/s",
          hasLED: false,
          ledType: "none",
        },
        seo: {
          slug: generateSlug("Samsung 990 PRO 2TB NVMe M.2 SSD"),
          metaTitle: "Samsung 990 PRO 2TB NVMe M.2 SSD - PCIe 4.0",
          metaDescription:
            "SSD Samsung 990 PRO 2TB NVMe M.2, đọc 7450MB/s ghi 6900MB/s. PCIe 4.0, hiệu năng cực cao.",
          metaKeywords: ["Samsung 990 PRO", "NVMe SSD", "2TB", "PCIe 4.0"],
        },
        tags: [
          { name: "High Performance", color: "#ffd43b", priority: 1 },
          { name: "Gaming", color: "#ff6b6b", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: true,
      });
    }

    if (storageSSDNVMe && brandMap.has("Western Digital")) {
      products.push({
        name: "WD Black SN850X 1TB NVMe M.2 SSD",
        sku: `WDC-STR-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "SSD WD Black SN850X 1TB NVMe M.2 - Đọc 7300MB/s, Ghi 6300MB/s, PCIe 4.0",
        fullDescription:
          "WD Black SN850X 1TB NVMe M.2 SSD với tốc độ đọc 7300MB/s và ghi 6300MB/s. PCIe 4.0 x4, controller WD Black G2, NAND 3D TLC. Hiệu năng cao cho gaming.",
        brandId: brandMap.get("Western Digital"),
        categoryId: storageSSDNVMe,
        colors: ["black"],
        pricing: {
          originalPrice: 3990000,
          salePrice: 3690000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 8,
        },
        inventory: {
          stock: randomStock(30, 70),
          lowStockThreshold: 15,
          isInStock: true,
        },
        images: createImages("WD Black SN850X 1TB NVMe", 4),
        specifications: {
          model: "WDS100T2X0E",
          partNumber: "WDS100T2X0E",
          warranty: "60 tháng",
          productType: "Hàng chính hãng",
          weight: "7g",
          dimensions: "80 x 22 x 2.38 mm",
          useCases: ["Gaming", "Văn phòng"],
          storageType: "NVMe SSD",
          capacity: "1TB",
          interface: "NVMe PCIe 4.0 x4",
          formFactorStorage: "M.2 2280",
          nandType: "3D TLC",
          readSpeed: "7300 MB/s",
          writeSpeed: "6300 MB/s",
          hasLED: false,
          ledType: "none",
        },
        seo: {
          slug: generateSlug("WD Black SN850X 1TB NVMe M.2 SSD"),
          metaTitle: "WD Black SN850X 1TB NVMe M.2 SSD - PCIe 4.0",
          metaDescription:
            "SSD WD Black SN850X 1TB NVMe M.2, đọc 7300MB/s ghi 6300MB/s. PCIe 4.0, hiệu năng gaming cao.",
          metaKeywords: ["WD Black SN850X", "NVMe SSD", "1TB", "PCIe 4.0"],
        },
        tags: [
          { name: "Gaming", color: "#ff6b6b", priority: 1 },
          { name: "Best Value", color: "#51cf66", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: false,
      });
    }

    // SSD SATA
    if (storageSSDSATA && brandMap.has("Samsung")) {
      products.push({
        name: "Samsung 870 EVO 1TB SATA SSD",
        sku: `SAM-STR-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "SSD Samsung 870 EVO 1TB SATA - Đọc 560MB/s, Ghi 530MB/s, 2.5 inch",
        fullDescription:
          "Samsung 870 EVO 1TB SATA SSD với tốc độ đọc 560MB/s và ghi 530MB/s. SATA III 6Gb/s, controller Samsung MKX, NAND V-NAND 3-bit MLC. Bền bỉ, hiệu năng ổn định.",
        brandId: brandMap.get("Samsung"),
        categoryId: storageSSDSATA,
        colors: ["black", "silver"],
        pricing: {
          originalPrice: 2490000,
          salePrice: 2290000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 8,
        },
        inventory: {
          stock: randomStock(40, 90),
          lowStockThreshold: 20,
          isInStock: true,
        },
        images: createImages("Samsung 870 EVO 1TB SATA", 4),
        specifications: {
          model: "MZ-77E1T0BW",
          partNumber: "MZ-77E1T0BW",
          warranty: "60 tháng",
          productType: "Hàng chính hãng",
          weight: "50g",
          dimensions: "100 x 69.85 x 6.8 mm",
          useCases: ["Văn phòng", "Học sinh - Sinh viên"],
          storageType: "SATA SSD",
          capacity: "1TB",
          interface: "SATA III 6Gb/s",
          formFactorStorage: '2.5"',
          nandType: "V-NAND 3-bit MLC",
          readSpeed: "560 MB/s",
          writeSpeed: "530 MB/s",
          hasLED: false,
          ledType: "none",
        },
        seo: {
          slug: generateSlug("Samsung 870 EVO 1TB SATA SSD"),
          metaTitle: "Samsung 870 EVO 1TB SATA SSD - 2.5 inch",
          metaDescription:
            "SSD Samsung 870 EVO 1TB SATA, đọc 560MB/s ghi 530MB/s. SATA III, bền bỉ, giá tốt.",
          metaKeywords: ["Samsung 870 EVO", "SATA SSD", "1TB", "2.5 inch"],
        },
        tags: [
          { name: "Budget", color: "#51cf66", priority: 1 },
          { name: "Reliable", color: "#339af0", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: false,
      });
    }

    // HDD
    if (storageHDDDesktop && brandMap.has("Western Digital")) {
      products.push({
        name: 'WD Blue 2TB 3.5" HDD',
        sku: `WDC-STR-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "HDD WD Blue 2TB 3.5 inch - 7200RPM, SATA 6Gb/s, 256MB Cache",
        fullDescription:
          'WD Blue 2TB 3.5" HDD với tốc độ quay 7200RPM, SATA 6Gb/s, cache 256MB. Dung lượng lớn, giá rẻ, phù hợp lưu trữ dữ liệu.',
        brandId: brandMap.get("Western Digital"),
        categoryId: storageHDDDesktop,
        colors: ["blue"],
        pricing: {
          originalPrice: 1990000,
          salePrice: 1790000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 10,
        },
        inventory: {
          stock: randomStock(50, 100),
          lowStockThreshold: 25,
          isInStock: true,
        },
        images: createImages("WD Blue 2TB HDD", 3),
        specifications: {
          model: "WD20EZBX",
          partNumber: "WD20EZBX",
          warranty: "24 tháng",
          productType: "Hàng chính hãng",
          weight: "630g",
          dimensions: "147 x 101.6 x 26.1 mm",
          useCases: ["Văn phòng", "Học sinh - Sinh viên"],
          storageType: "HDD",
          capacity: "2TB",
          interface: "SATA III 6Gb/s",
          formFactorStorage: '3.5"',
          nandType: "N/A",
          readSpeed: "N/A",
          writeSpeed: "N/A",
          hasLED: false,
          ledType: "none",
        },
        seo: {
          slug: generateSlug("WD Blue 2TB 3.5 HDD"),
          metaTitle: "WD Blue 2TB 3.5 inch HDD - 7200RPM",
          metaDescription:
            "HDD WD Blue 2TB 3.5 inch, 7200RPM, SATA 6Gb/s. Dung lượng lớn, giá rẻ cho lưu trữ.",
          metaKeywords: ["WD Blue", "HDD", "2TB", "7200RPM"],
        },
        tags: [
          { name: "Budget", color: "#51cf66", priority: 1 },
          { name: "Storage", color: "#339af0", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: false,
      });
    }

    // ========== PSU Products ==========
    const psuGold750W = categoryMap.get("PSU 80 Plus Gold 750W");
    const psuGold850W = categoryMap.get("PSU 80 Plus Gold 850W");
    const psuPlatinum850W = categoryMap.get("PSU 80 Plus Platinum 850W");

    // PSU Gold
    if (psuGold750W && brandMap.has("Corsair")) {
      products.push({
        name: "Corsair RM750e 750W 80 Plus Gold",
        sku: `COR-PSU-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "PSU Corsair RM750e 750W - 80 Plus Gold, Full Modular, ATX 3.0",
        fullDescription:
          "Corsair RM750e 750W 80 Plus Gold với hiệu suất 90%, Full Modular, ATX 3.0 compliant. Quạt 120mm, bảo hành 7 năm. Phù hợp cho gaming PC mid-high end.",
        brandId: brandMap.get("Corsair"),
        categoryId: psuGold750W,
        colors: ["black"],
        pricing: {
          originalPrice: 2990000,
          salePrice: 2790000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 7,
        },
        inventory: {
          stock: randomStock(25, 60),
          lowStockThreshold: 12,
          isInStock: true,
        },
        images: createImages("Corsair RM750e 750W", 4),
        specifications: {
          model: "CP-9020262-NA",
          partNumber: "CP-9020262-NA",
          warranty: "84 tháng",
          productType: "Hàng chính hãng",
          weight: "1.2kg",
          dimensions: "150 x 86 x 160 mm",
          useCases: ["Gaming", "Văn phòng"],
          psuSeries: "RM",
          wattage: "750W",
          efficiency: "80 Plus Gold",
          modular: "Full Modular",
          cables:
            "1 x 24-pin ATX\n1 x 8-pin (4+4) EPS\n2 x 8-pin (6+2) PCIe\n1 x 16-pin (12VHPWR)",
          coolingFan: "1 x 120mm",
          inputVoltage: "100 - 240VAC",
          hasLED: false,
          ledType: "none",
        },
        seo: {
          slug: generateSlug("Corsair RM750e 750W 80 Plus Gold"),
          metaTitle: "Corsair RM750e 750W 80 Plus Gold - Full Modular",
          metaDescription:
            "PSU Corsair RM750e 750W 80 Plus Gold, Full Modular, ATX 3.0. Hiệu suất 90%, bảo hành 7 năm.",
          metaKeywords: [
            "Corsair RM750e",
            "750W",
            "80 Plus Gold",
            "Full Modular",
          ],
        },
        tags: [
          { name: "Gaming", color: "#ff6b6b", priority: 1 },
          { name: "Best Value", color: "#51cf66", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: false,
      });
    }

    if (psuGold850W && brandMap.has("Seasonic")) {
      products.push({
        name: "Seasonic Focus GX-850 850W 80 Plus Gold",
        sku: `SEA-PSU-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "PSU Seasonic Focus GX-850 850W - 80 Plus Gold, Full Modular",
        fullDescription:
          "Seasonic Focus GX-850 850W 80 Plus Gold với hiệu suất 90%, Full Modular. Quạt 135mm, bảo hành 10 năm. Chất lượng cao, ổn định.",
        brandId: brandMap.get("Seasonic"),
        categoryId: psuGold850W,
        colors: ["black"],
        pricing: {
          originalPrice: 3990000,
          salePrice: 3690000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 8,
        },
        inventory: {
          stock: randomStock(20, 50),
          lowStockThreshold: 10,
          isInStock: true,
        },
        images: createImages("Seasonic Focus GX-850 850W", 4),
        specifications: {
          model: "SSR-850FX",
          partNumber: "SSR-850FX",
          warranty: "120 tháng",
          productType: "Hàng chính hãng",
          weight: "1.4kg",
          dimensions: "150 x 86 x 160 mm",
          useCases: ["Gaming", "Đồ họa - Kỹ thuật"],
          psuSeries: "Focus",
          wattage: "850W",
          efficiency: "80 Plus Gold",
          modular: "Full Modular",
          cables: "1 x 24-pin ATX\n1 x 8-pin (4+4) EPS\n4 x 8-pin (6+2) PCIe",
          coolingFan: "1 x 135mm",
          inputVoltage: "100 - 240VAC",
          hasLED: false,
          ledType: "none",
        },
        seo: {
          slug: generateSlug("Seasonic Focus GX-850 850W 80 Plus Gold"),
          metaTitle: "Seasonic Focus GX-850 850W 80 Plus Gold - Full Modular",
          metaDescription:
            "PSU Seasonic Focus GX-850 850W 80 Plus Gold, Full Modular. Hiệu suất 90%, bảo hành 10 năm.",
          metaKeywords: [
            "Seasonic Focus",
            "850W",
            "80 Plus Gold",
            "Full Modular",
          ],
        },
        tags: [
          { name: "Premium", color: "#ffd43b", priority: 1 },
          { name: "Gaming", color: "#ff6b6b", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: true,
      });
    }

    // PSU Platinum
    if (psuPlatinum850W && brandMap.has("Corsair")) {
      products.push({
        name: "Corsair HX850i 850W 80 Plus Platinum",
        sku: `COR-PSU-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "PSU Corsair HX850i 850W - 80 Plus Platinum, Full Modular, Digital",
        fullDescription:
          "Corsair HX850i 850W 80 Plus Platinum với hiệu suất 92%, Full Modular, Digital monitoring qua iCUE. Quạt 140mm, bảo hành 10 năm. Flagship cho high-end builds.",
        brandId: brandMap.get("Corsair"),
        categoryId: psuPlatinum850W,
        colors: ["black"],
        pricing: {
          originalPrice: 5990000,
          currency: "VND",
          isOnSale: false,
        },
        inventory: {
          stock: randomStock(12, 30),
          lowStockThreshold: 6,
          isInStock: true,
        },
        images: createImages("Corsair HX850i 850W Platinum", 4),
        specifications: {
          model: "CP-9020070-NA",
          partNumber: "CP-9020070-NA",
          warranty: "120 tháng",
          productType: "Hàng chính hãng",
          weight: "1.6kg",
          dimensions: "150 x 86 x 180 mm",
          useCases: ["Gaming", "Đồ họa - Kỹ thuật", "Doanh nghiệp"],
          psuSeries: "HX",
          wattage: "850W",
          efficiency: "80 Plus Platinum",
          modular: "Full Modular",
          cables: "1 x 24-pin ATX\n1 x 8-pin (4+4) EPS\n4 x 8-pin (6+2) PCIe",
          coolingFan: "1 x 140mm",
          inputVoltage: "100 - 240VAC",
          hasLED: false,
          ledType: "none",
        },
        seo: {
          slug: generateSlug("Corsair HX850i 850W 80 Plus Platinum"),
          metaTitle: "Corsair HX850i 850W 80 Plus Platinum - Digital",
          metaDescription:
            "PSU Corsair HX850i 850W 80 Plus Platinum, Full Modular, Digital iCUE. Hiệu suất 92%, bảo hành 10 năm.",
          metaKeywords: [
            "Corsair HX850i",
            "850W",
            "80 Plus Platinum",
            "Digital",
          ],
        },
        tags: [
          { name: "Flagship", color: "#ff6b6b", priority: 1 },
          { name: "Digital", color: "#339af0", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: true,
      });
    }

    // ========== Case Products ==========
    const caseATXMidTower = categoryMap.get("Case ATX Mid Tower");
    const caseATXFullTower = categoryMap.get("Case ATX Full Tower");
    const caseMATXStandard = categoryMap.get("Case mATX Standard");

    // Case ATX
    if (caseATXMidTower && brandMap.has("NZXT")) {
      products.push({
        name: "NZXT H7 Flow Mid Tower Case",
        sku: `NZX-CAS-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "Case NZXT H7 Flow - Mid Tower, Tempered Glass, Airflow",
        fullDescription:
          "NZXT H7 Flow Mid Tower Case với thiết kế airflow tối ưu, mặt trước và trên có lưới tản nhiệt. Kính cường lực tempered glass, hỗ trợ ATX, mATX, ITX. RGB ready.",
        brandId: brandMap.get("NZXT"),
        categoryId: caseATXMidTower,
        colors: ["black", "white"],
        pricing: {
          originalPrice: 3990000,
          salePrice: 3690000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 8,
        },
        inventory: {
          stock: randomStock(20, 50),
          lowStockThreshold: 10,
          isInStock: true,
        },
        images: createImages("NZXT H7 Flow Mid Tower", 5),
        specifications: {
          model: "CM-H71FB-01",
          partNumber: "CM-H71FB-01",
          warranty: "24 tháng",
          productType: "Hàng chính hãng",
          weight: "8.5kg",
          dimensions: "505 x 230 x 516 mm",
          useCases: ["Gaming", "Văn phòng"],
          caseName: "H7 Flow",
          caseType: "Mid Tower",
          material: "Thép + Nhựa",
          sidePanelMaterial: "Kính cường lực",
          supportedMainboard: ["Mini-ITX", "Micro-ATX", "ATX"],
          maxGPULength: "413mm",
          maxCPUCoolerHeight: "185mm",
          maxRadiatorSize: "360 mm",
          driveBays: ['2 x 3.5"', '4 x 2.5"'],
          frontPorts: [
            "1 x USB 3.2 Gen 2 Type-C",
            "2 x USB 3.2 Gen 1 Type-A",
            "1 x Audio/Mic",
          ],
          topFanSupport: "3 x 120 mm, 2 x 140 mm",
          rearFanSupport: "1 x 120 mm, 1 x 140 mm",
          bottomFanSupport: "2 x 120 mm",
          pciSlots: 7,
          hasLED: false,
          ledType: "none",
        },
        seo: {
          slug: generateSlug("NZXT H7 Flow Mid Tower Case"),
          metaTitle: "NZXT H7 Flow Mid Tower Case - Tempered Glass",
          metaDescription:
            "Case NZXT H7 Flow Mid Tower, tempered glass, airflow tối ưu. Hỗ trợ ATX, mATX, ITX, RGB ready.",
          metaKeywords: [
            "NZXT H7 Flow",
            "Mid Tower",
            "Tempered Glass",
            "Airflow",
          ],
        },
        tags: [
          { name: "Gaming", color: "#ff6b6b", priority: 1 },
          { name: "Airflow", color: "#339af0", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: false,
      });
    }

    if (caseATXFullTower && brandMap.has("Corsair")) {
      products.push({
        name: "Corsair 7000D Airflow Full Tower Case",
        sku: `COR-CAS-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "Case Corsair 7000D Airflow - Full Tower, Tempered Glass, E-ATX",
        fullDescription:
          "Corsair 7000D Airflow Full Tower Case với thiết kế lớn, hỗ trợ E-ATX. Kính cường lực tempered glass, airflow tối ưu. Phù hợp cho high-end builds và custom water cooling.",
        brandId: brandMap.get("Corsair"),
        categoryId: caseATXFullTower,
        colors: ["black"],
        pricing: {
          originalPrice: 6990000,
          currency: "VND",
          isOnSale: false,
        },
        inventory: {
          stock: randomStock(10, 25),
          lowStockThreshold: 5,
          isInStock: true,
        },
        images: createImages("Corsair 7000D Airflow Full Tower", 5),
        specifications: {
          model: "CC-9011219-WW",
          partNumber: "CC-9011219-WW",
          warranty: "24 tháng",
          productType: "Hàng chính hãng",
          weight: "15.5kg",
          dimensions: "600 x 280 x 600 mm",
          useCases: ["Gaming", "Đồ họa - Kỹ thuật"],
          caseName: "7000D Airflow",
          caseType: "Full Tower",
          material: "Thép + Nhựa",
          sidePanelMaterial: "Kính cường lực",
          supportedMainboard: ["Mini-ITX", "Micro-ATX", "ATX", "E-ATX"],
          maxGPULength: "460mm",
          maxCPUCoolerHeight: "190mm",
          maxRadiatorSize: "480 mm",
          driveBays: ['4 x 3.5"', '6 x 2.5"'],
          frontPorts: [
            "1 x USB 3.2 Gen 2 Type-C",
            "2 x USB 3.2 Gen 1 Type-A",
            "1 x Audio/Mic",
          ],
          topFanSupport: "3 x 120 mm, 2 x 140 mm",
          rearFanSupport: "1 x 120 mm, 1 x 140 mm",
          bottomFanSupport: "3 x 120 mm, 2 x 140 mm",
          pciSlots: 8,
          hasLED: false,
          ledType: "none",
        },
        seo: {
          slug: generateSlug("Corsair 7000D Airflow Full Tower Case"),
          metaTitle: "Corsair 7000D Airflow Full Tower Case - E-ATX",
          metaDescription:
            "Case Corsair 7000D Airflow Full Tower, E-ATX, tempered glass. Phù hợp high-end builds và water cooling.",
          metaKeywords: ["Corsair 7000D", "Full Tower", "E-ATX", "Airflow"],
        },
        tags: [
          { name: "Premium", color: "#ffd43b", priority: 1 },
          { name: "Gaming", color: "#ff6b6b", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: true,
      });
    }

    // ========== Cooling Products ==========
    const coolingCPUAirTower = categoryMap.get("Cooling CPU Air Tower");
    const coolingCPUAIO240 = categoryMap.get("Cooling CPU AIO 240mm");

    // CPU Air Cooler
    if (coolingCPUAirTower && brandMap.has("Noctua")) {
      products.push({
        name: "Noctua NH-D15 Chromax Black CPU Air Cooler",
        sku: `NOC-COO-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "CPU Cooler Noctua NH-D15 Chromax Black - Dual Tower, 2 quạt 140mm",
        fullDescription:
          "Noctua NH-D15 Chromax Black CPU Air Cooler với thiết kế dual tower, 2 quạt 140mm. Tản nhiệt mạnh mẽ, yên tĩnh. Tương thích Intel LGA1700, LGA1200 và AMD AM5, AM4.",
        brandId: brandMap.get("Noctua"),
        categoryId: coolingCPUAirTower,
        colors: ["black"],
        pricing: {
          originalPrice: 3990000,
          currency: "VND",
          isOnSale: false,
        },
        inventory: {
          stock: randomStock(15, 40),
          lowStockThreshold: 8,
          isInStock: true,
        },
        images: createImages("Noctua NH-D15 Chromax Black", 4),
        specifications: {
          model: "NH-D15 chromax.black",
          partNumber: "NH-D15 chromax.black",
          warranty: "72 tháng",
          productType: "Hàng chính hãng",
          weight: "1.32kg",
          dimensions: "160 x 150 x 165 mm",
          useCases: ["Gaming", "Đồ họa - Kỹ thuật"],
          coolingType: "Air Cooler",
          socketCompatibility: [
            "Intel LGA1700",
            "Intel LGA1200",
            "AMD AM5",
            "AMD AM4",
          ],
          fanSize: "2 x 140mm",
          coolingMaterial: "Nhôm + Đồng",
          radiatorSize: "N/A",
          height: "165mm",
          pumpRPM: "N/A",
          fanRPM: "300 - 1500 RPM",
          airflowCFM: "82.52 CFM",
          noiseLevel: "24.6 dBA",
          hasLED: false,
          ledType: "none",
        },
        seo: {
          slug: generateSlug("Noctua NH-D15 Chromax Black CPU Air Cooler"),
          metaTitle: "Noctua NH-D15 Chromax Black - CPU Air Cooler",
          metaDescription:
            "CPU Cooler Noctua NH-D15 Chromax Black, dual tower, 2 quạt 140mm. Tản nhiệt mạnh, yên tĩnh.",
          metaKeywords: [
            "Noctua NH-D15",
            "CPU Air Cooler",
            "Dual Tower",
            "140mm",
          ],
        },
        tags: [
          { name: "Premium", color: "#ffd43b", priority: 1 },
          { name: "Quiet", color: "#339af0", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: true,
      });
    }

    // CPU AIO
    if (coolingCPUAIO240 && brandMap.has("Corsair")) {
      products.push({
        name: "Corsair iCUE H100i RGB Elite 240mm AIO",
        sku: `COR-COO-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "CPU Cooler Corsair iCUE H100i RGB Elite - AIO 240mm, RGB, iCUE",
        fullDescription:
          "Corsair iCUE H100i RGB Elite 240mm AIO với 2 quạt 120mm RGB, pump RGB. Tương thích iCUE software, tản nhiệt hiệu quả. Hỗ trợ Intel LGA1700, LGA1200 và AMD AM5, AM4.",
        brandId: brandMap.get("Corsair"),
        categoryId: coolingCPUAIO240,
        colors: ["black", "rgb"],
        pricing: {
          originalPrice: 4990000,
          salePrice: 4590000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 8,
        },
        inventory: {
          stock: randomStock(18, 45),
          lowStockThreshold: 9,
          isInStock: true,
        },
        images: createImages("Corsair iCUE H100i RGB Elite", 5),
        specifications: {
          model: "CW-9060072-WW",
          partNumber: "CW-9060072-WW",
          warranty: "60 tháng",
          productType: "Hàng chính hãng",
          weight: "1.1kg",
          dimensions: "277 x 120 x 27 mm",
          useCases: ["Gaming", "Văn phòng"],
          coolingType: "AIO Liquid",
          socketCompatibility: [
            "Intel LGA1700",
            "Intel LGA1200",
            "AMD AM5",
            "AMD AM4",
          ],
          fanSize: "2 x 120mm",
          coolingMaterial: "Nhôm + Đồng",
          radiatorSize: "240 mm",
          height: "N/A",
          pumpRPM: "2000 - 3000 RPM",
          fanRPM: "400 - 2400 RPM",
          airflowCFM: "75.05 CFM",
          noiseLevel: "31.9 dBA",
          hasLED: true,
          ledType: "RGB",
        },
        seo: {
          slug: generateSlug("Corsair iCUE H100i RGB Elite 240mm AIO"),
          metaTitle: "Corsair iCUE H100i RGB Elite 240mm AIO - RGB",
          metaDescription:
            "CPU Cooler Corsair iCUE H100i RGB Elite 240mm AIO, RGB, iCUE. Tản nhiệt hiệu quả, đẹp mắt.",
          metaKeywords: ["Corsair H100i", "AIO 240mm", "RGB", "iCUE"],
        },
        tags: [
          { name: "RGB", color: "#339af0", priority: 1 },
          { name: "Gaming", color: "#ff6b6b", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: false,
      });
    }

    // ========== Monitor Products ==========
    const monitorGaming1440p = categoryMap.get("Monitor Gaming 1440p");
    const monitorGaming4K = categoryMap.get("Monitor Gaming 4K");
    const monitorOffice1080p = categoryMap.get("Monitor Office 1080p");

    // Monitor Gaming
    if (monitorGaming1440p && brandMap.has("ASUS")) {
      products.push({
        name: 'ASUS ROG Strix XG27AQ 27" 1440p 170Hz Gaming Monitor',
        sku: `ASU-MON-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "Monitor ASUS ROG Strix XG27AQ 27 inch - 1440p QHD, 170Hz, IPS, G-Sync",
        fullDescription:
          'ASUS ROG Strix XG27AQ 27" Gaming Monitor với độ phân giải 2560x1440 QHD, tần số quét 170Hz. Panel IPS, G-Sync Compatible, HDR400. Hiệu năng gaming vượt trội.',
        brandId: brandMap.get("ASUS"),
        categoryId: monitorGaming1440p,
        colors: ["black"],
        pricing: {
          originalPrice: 8990000,
          salePrice: 8490000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 6,
        },
        inventory: {
          stock: randomStock(15, 40),
          lowStockThreshold: 8,
          isInStock: true,
        },
        images: createImages("ASUS ROG Strix XG27AQ 27 inch", 5),
        specifications: {
          model: "XG27AQ",
          partNumber: "90LM06B0-B01370",
          warranty: "36 tháng",
          productType: "Hàng chính hãng",
          weight: "6.5kg",
          dimensions: "614.4 x 365.1 x 60.9 mm",
          useCases: ["Gaming", "Văn phòng"],
          screenSize: '27"',
          resolution: "2560x1440",
          panelType: "IPS",
          refreshRate: "170Hz",
          responseTime: "1ms",
          brightness: "400 nits",
          contrast: "1000:1",
          colorGamut: "99% sRGB",
          features: ["G-Sync Compatible", "HDR400", "FreeSync Premium"],
          hasLED: false,
          ledType: "none",
        },
        seo: {
          slug: generateSlug(
            "ASUS ROG Strix XG27AQ 27 1440p 170Hz Gaming Monitor"
          ),
          metaTitle: "ASUS ROG Strix XG27AQ 27 inch 1440p 170Hz Gaming Monitor",
          metaDescription:
            "Monitor ASUS ROG Strix XG27AQ 27 inch, 1440p QHD, 170Hz, IPS, G-Sync. Hiệu năng gaming vượt trội.",
          metaKeywords: ["ASUS ROG Strix", "1440p", "170Hz", "Gaming Monitor"],
        },
        tags: [
          { name: "Gaming", color: "#ff6b6b", priority: 1 },
          { name: "1440p", color: "#339af0", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: true,
      });
    }

    if (monitorGaming4K && brandMap.has("LG")) {
      products.push({
        name: 'LG 27GP950-B 27" 4K 144Hz Gaming Monitor',
        sku: `LGE-MON-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "Monitor LG 27GP950-B 27 inch - 4K UHD, 144Hz, IPS, G-Sync, HDR600",
        fullDescription:
          'LG 27GP950-B 27" Gaming Monitor với độ phân giải 3840x2160 4K UHD, tần số quét 144Hz. Panel IPS Nano, G-Sync Compatible, HDR600. Hiệu năng 4K gaming cực mạnh.',
        brandId: brandMap.get("LG"),
        categoryId: monitorGaming4K,
        colors: ["black"],
        pricing: {
          originalPrice: 14990000,
          currency: "VND",
          isOnSale: false,
        },
        inventory: {
          stock: randomStock(8, 20),
          lowStockThreshold: 4,
          isInStock: true,
        },
        images: createImages("LG 27GP950-B 27 inch 4K", 5),
        specifications: {
          model: "27GP950-B",
          partNumber: "27GP950-B",
          warranty: "36 tháng",
          productType: "Hàng chính hãng",
          weight: "7.2kg",
          dimensions: "614.4 x 365.1 x 60.9 mm",
          useCases: ["Gaming", "Đồ họa - Kỹ thuật"],
          screenSize: '27"',
          resolution: "3840x2160",
          panelType: "IPS",
          refreshRate: "144Hz",
          responseTime: "1ms",
          brightness: "600 nits",
          contrast: "1000:1",
          colorGamut: "98% DCI-P3",
          features: ["G-Sync Compatible", "HDR600", "FreeSync Premium Pro"],
          hasLED: false,
          ledType: "none",
        },
        seo: {
          slug: generateSlug("LG 27GP950-B 27 4K 144Hz Gaming Monitor"),
          metaTitle: "LG 27GP950-B 27 inch 4K 144Hz Gaming Monitor",
          metaDescription:
            "Monitor LG 27GP950-B 27 inch, 4K UHD, 144Hz, IPS, G-Sync, HDR600. Hiệu năng 4K gaming cực mạnh.",
          metaKeywords: ["LG 27GP950-B", "4K", "144Hz", "Gaming Monitor"],
        },
        tags: [
          { name: "Flagship", color: "#ff6b6b", priority: 1 },
          { name: "4K", color: "#339af0", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: true,
      });
    }

    // Monitor Office
    if (monitorOffice1080p && brandMap.has("Dell")) {
      products.push({
        name: 'Dell P2422H 24" 1080p Office Monitor',
        sku: `DEL-MON-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "Monitor Dell P2422H 24 inch - 1080p Full HD, IPS, USB-C",
        fullDescription:
          'Dell P2422H 24" Office Monitor với độ phân giải 1920x1080 Full HD, panel IPS. USB-C connectivity, thiết kế tối giản. Phù hợp cho văn phòng và học tập.',
        brandId: brandMap.get("Dell"),
        categoryId: monitorOffice1080p,
        colors: ["black"],
        pricing: {
          originalPrice: 4990000,
          salePrice: 4490000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 10,
        },
        inventory: {
          stock: randomStock(30, 70),
          lowStockThreshold: 15,
          isInStock: true,
        },
        images: createImages("Dell P2422H 24 inch Office", 4),
        specifications: {
          model: "P2422H",
          partNumber: "P2422H",
          warranty: "36 tháng",
          productType: "Hàng chính hãng",
          weight: "4.2kg",
          dimensions: "539.8 x 323.9 x 50.8 mm",
          useCases: ["Văn phòng", "Học sinh - Sinh viên"],
          screenSize: '24"',
          resolution: "1920x1080",
          panelType: "IPS",
          refreshRate: "60Hz",
          responseTime: "5ms",
          brightness: "250 nits",
          contrast: "1000:1",
          colorGamut: "99% sRGB",
          features: ["USB-C", "VESA Mount"],
          hasLED: false,
          ledType: "none",
        },
        seo: {
          slug: generateSlug("Dell P2422H 24 1080p Office Monitor"),
          metaTitle: "Dell P2422H 24 inch 1080p Office Monitor",
          metaDescription:
            "Monitor Dell P2422H 24 inch, 1080p Full HD, IPS, USB-C. Phù hợp văn phòng và học tập.",
          metaKeywords: ["Dell P2422H", "1080p", "Office Monitor", "USB-C"],
        },
        tags: [
          { name: "Office", color: "#51cf66", priority: 1 },
          { name: "Budget", color: "#51cf66", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: false,
      });
    }

    // ========== Keyboard Products ==========
    const keyboardMechanicalFull = categoryMap.get(
      "Keyboard Mechanical Full Size"
    );
    const keyboardMechanicalTKL = categoryMap.get("Keyboard Mechanical TKL");
    const keyboardOfficeMembrane = categoryMap.get("Keyboard Office Membrane");

    if (keyboardMechanicalFull && brandMap.has("Corsair")) {
      products.push({
        name: "Corsair K95 RGB Platinum XT Mechanical Keyboard",
        sku: `COR-KEY-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "Bàn phím cơ Corsair K95 RGB Platinum XT - Full size, switch Cherry MX, RGB, wrist rest",
        fullDescription:
          "Corsair K95 RGB Platinum XT là bàn phím cơ full size với switch Cherry MX, 6 phím macro, RGB per-key, wrist rest. Phù hợp cho game thủ hardcore và streamer.",
        brandId: brandMap.get("Corsair"),
        categoryId: keyboardMechanicalFull,
        colors: ["black", "rgb"],
        pricing: {
          originalPrice: 4990000,
          salePrice: 4590000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 8,
        },
        inventory: {
          stock: randomStock(20, 60),
          lowStockThreshold: 10,
          isInStock: true,
        },
        images: createImages("Corsair K95 RGB Platinum XT", 4),
        specifications: {
          model: "K95 RGB Platinum XT",
          partNumber: "CH-9127414-NA",
          warranty: "24 tháng",
          productType: "Hàng chính hãng",
          weight: "1.3kg",
          dimensions: "465 x 171 x 36 mm",
          useCases: ["Gaming", "Văn phòng"],
          hasLED: true,
          ledType: "RGB",
        },
        seo: {
          slug: generateSlug("Corsair K95 RGB Platinum XT Mechanical Keyboard"),
          metaTitle: "Corsair K95 RGB Platinum XT - Mechanical Keyboard",
          metaDescription:
            "Bàn phím cơ Corsair K95 RGB Platinum XT full size, switch Cherry MX, 6 macro key, RGB per-key.",
          metaKeywords: [
            "Corsair K95",
            "Mechanical Keyboard",
            "RGB",
            "Gaming Keyboard",
          ],
        },
        tags: [
          { name: "Gaming", color: "#ff6b6b", priority: 1 },
          { name: "RGB", color: "#339af0", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: false,
      });
    }

    if (keyboardMechanicalTKL && brandMap.has("Razer")) {
      products.push({
        name: "Razer Huntsman Tournament Edition TKL",
        sku: `RAZ-KEY-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "Bàn phím cơ Razer Huntsman TE - TKL, switch quang học, RGB Chroma",
        fullDescription:
          "Razer Huntsman Tournament Edition là bàn phím cơ TKL với switch quang học, keycap PBT doubleshot, dây cáp USB-C tháo rời. Thiết kế gọn nhẹ cho game thủ esports.",
        brandId: brandMap.get("Razer"),
        categoryId: keyboardMechanicalTKL,
        colors: ["black", "rgb"],
        pricing: {
          originalPrice: 3290000,
          salePrice: 2990000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 9,
        },
        inventory: {
          stock: randomStock(25, 70),
          lowStockThreshold: 12,
          isInStock: true,
        },
        images: createImages("Razer Huntsman Tournament Edition", 4),
        specifications: {
          model: "Huntsman TE",
          partNumber: "RZ03-03080100-R3M1",
          warranty: "24 tháng",
          productType: "Hàng chính hãng",
          weight: "0.75kg",
          dimensions: "362 x 140 x 36 mm",
          useCases: ["Gaming"],
          hasLED: true,
          ledType: "RGB",
        },
        seo: {
          slug: generateSlug("Razer Huntsman Tournament Edition TKL"),
          metaTitle: "Razer Huntsman TE - TKL Optical Keyboard",
          metaDescription:
            "Bàn phím cơ Razer Huntsman Tournament Edition TKL, switch quang học, keycap PBT, RGB Chroma.",
          metaKeywords: [
            "Razer Huntsman TE",
            "TKL keyboard",
            "optical switch",
            "RGB",
          ],
        },
        tags: [
          { name: "Esports", color: "#ff6b6b", priority: 1 },
          { name: "RGB", color: "#339af0", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: true,
      });
    }

    if (keyboardOfficeMembrane && brandMap.has("Logitech")) {
      products.push({
        name: "Logitech MK295 Silent Wireless Combo",
        sku: `LOG-KEY-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "Combo phím chuột Logitech MK295 - Không dây, chống ồn, dành cho văn phòng",
        fullDescription:
          "Logitech MK295 Silent Wireless Combo gồm bàn phím full size và chuột không dây, công nghệ SilentTouch giảm tiếng ồn, pin lâu, phù hợp môi trường văn phòng yên tĩnh.",
        brandId: brandMap.get("Logitech"),
        categoryId: keyboardOfficeMembrane,
        colors: ["black"],
        pricing: {
          originalPrice: 899000,
          salePrice: 799000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 11,
        },
        inventory: {
          stock: randomStock(40, 100),
          lowStockThreshold: 20,
          isInStock: true,
        },
        images: createImages("Logitech MK295 Silent Wireless Combo", 3),
        specifications: {
          model: "MK295",
          partNumber: "920-009800",
          warranty: "24 tháng",
          productType: "Hàng chính hãng",
          weight: "0.8kg",
          dimensions: "441 x 149 x 18 mm",
          useCases: ["Văn phòng", "Học sinh - Sinh viên"],
          hasLED: false,
          ledType: "none",
        },
        seo: {
          slug: generateSlug("Logitech MK295 Silent Wireless Combo"),
          metaTitle: "Logitech MK295 Silent Wireless - Phím chuột văn phòng",
          metaDescription:
            "Combo phím chuột Logitech MK295 Silent Wireless, chống ồn, không dây, phù hợp văn phòng.",
          metaKeywords: [
            "Logitech MK295",
            "wireless keyboard mouse combo",
            "silent",
            "office",
          ],
        },
        tags: [
          { name: "Office", color: "#51cf66", priority: 1 },
          { name: "Wireless", color: "#339af0", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: false,
      });
    }

    // ========== Mouse Products ==========
    const mouseGamingWireless = categoryMap.get("Mouse Gaming Wireless");
    const mouseGamingWired = categoryMap.get("Mouse Gaming Wired");

    if (mouseGamingWireless && brandMap.has("Razer")) {
      products.push({
        name: "Razer DeathAdder V3 Pro Wireless",
        sku: `RAZ-MOU-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "Chuột Razer DeathAdder V3 Pro - Wireless, siêu nhẹ, sensor 30K DPI",
        fullDescription:
          "Razer DeathAdder V3 Pro là chuột gaming không dây siêu nhẹ, sensor Focus Pro 30K DPI, switch quang học Gen-3, thời lượng pin dài. Phù hợp cho game FPS cạnh tranh.",
        brandId: brandMap.get("Razer"),
        categoryId: mouseGamingWireless,
        colors: ["black"],
        pricing: {
          originalPrice: 3990000,
          salePrice: 3690000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 8,
        },
        inventory: {
          stock: randomStock(20, 50),
          lowStockThreshold: 10,
          isInStock: true,
        },
        images: createImages("Razer DeathAdder V3 Pro Wireless", 4),
        specifications: {
          model: "DeathAdder V3 Pro",
          partNumber: "RZ01-04630100-R3A1",
          warranty: "24 tháng",
          productType: "Hàng chính hãng",
          weight: "63g",
          dimensions: "128 x 68 x 44 mm",
          useCases: ["Gaming"],
          hasLED: false,
          ledType: "none",
        },
        seo: {
          slug: generateSlug("Razer DeathAdder V3 Pro Wireless"),
          metaTitle: "Razer DeathAdder V3 Pro Wireless - Chuột gaming siêu nhẹ",
          metaDescription:
            "Chuột Razer DeathAdder V3 Pro Wireless, siêu nhẹ, sensor 30K DPI, switch quang học Gen-3.",
          metaKeywords: [
            "Razer DeathAdder V3 Pro",
            "wireless gaming mouse",
            "30K DPI",
          ],
        },
        tags: [
          { name: "Esports", color: "#ff6b6b", priority: 1 },
          { name: "Wireless", color: "#339af0", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: true,
      });
    }

    if (mouseGamingWired && brandMap.has("Logitech")) {
      products.push({
        name: "Logitech G502 HERO Wired Gaming Mouse",
        sku: `LOG-MOU-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "Chuột Logitech G502 HERO - Có dây, 25K DPI, nhiều nút lập trình",
        fullDescription:
          "Logitech G502 HERO là chuột gaming có dây với sensor HERO 25K DPI, 11 nút lập trình, trọng lượng tùy chỉnh. Rất phổ biến cho game FPS/MOBA.",
        brandId: brandMap.get("Logitech"),
        categoryId: mouseGamingWired,
        colors: ["black", "rgb"],
        pricing: {
          originalPrice: 1490000,
          salePrice: 1290000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 13,
        },
        inventory: {
          stock: randomStock(30, 80),
          lowStockThreshold: 15,
          isInStock: true,
        },
        images: createImages("Logitech G502 HERO", 4),
        specifications: {
          model: "G502 HERO",
          partNumber: "910-005470",
          warranty: "24 tháng",
          productType: "Hàng chính hãng",
          weight: "121g",
          dimensions: "132 x 75 x 40 mm",
          useCases: ["Gaming"],
          hasLED: true,
          ledType: "RGB",
        },
        seo: {
          slug: generateSlug("Logitech G502 HERO Wired Gaming Mouse"),
          metaTitle: "Logitech G502 HERO - Chuột gaming 25K DPI",
          metaDescription:
            "Chuột Logitech G502 HERO có dây, sensor HERO 25K DPI, 11 nút lập trình, trọng lượng tùy chỉnh.",
          metaKeywords: [
            "Logitech G502",
            "gaming mouse",
            "25K DPI",
            "wired mouse",
          ],
        },
        tags: [
          { name: "Best Seller", color: "#ff6b6b", priority: 1 },
          { name: "RGB", color: "#339af0", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: false,
      });
    }

    // ========== Networking Products ==========
    const wifiCardPCIe = categoryMap.get("Networking WiFi Card PCIe");

    if (wifiCardPCIe && brandMap.has("ASUS")) {
      products.push({
        name: "ASUS PCE-AX3000 WiFi 6 PCIe Card",
        sku: `ASU-NET-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "Card WiFi ASUS PCE-AX3000 - WiFi 6, Bluetooth 5.0, PCIe x1",
        fullDescription:
          "ASUS PCE-AX3000 là card WiFi 6 PCIe với tốc độ lên đến 3000Mbps, hỗ trợ Bluetooth 5.0, 2 ăng-ten rời. Giải pháp nâng cấp WiFi cho PC build.",
        brandId: brandMap.get("ASUS"),
        categoryId: wifiCardPCIe,
        colors: ["black"],
        pricing: {
          originalPrice: 1490000,
          salePrice: 1390000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 7,
        },
        inventory: {
          stock: randomStock(20, 50),
          lowStockThreshold: 10,
          isInStock: true,
        },
        images: createImages("ASUS PCE-AX3000 WiFi 6 PCIe Card", 3),
        specifications: {
          model: "PCE-AX3000",
          partNumber: "90IG0610-MO0R00",
          warranty: "36 tháng",
          productType: "Hàng chính hãng",
          weight: "200g",
          dimensions: "103 x 68.9 x 21 mm",
          useCases: ["Gaming", "Văn phòng"],
          hasLED: false,
          ledType: "none",
        },
        seo: {
          slug: generateSlug("ASUS PCE-AX3000 WiFi 6 PCIe Card"),
          metaTitle: "ASUS PCE-AX3000 - Card WiFi 6 PCIe",
          metaDescription:
            "Card WiFi ASUS PCE-AX3000 WiFi 6, Bluetooth 5.0, PCIe x1. Nâng cấp WiFi cho PC build.",
          metaKeywords: ["ASUS PCE-AX3000", "WiFi 6", "PCIe WiFi card"],
        },
        tags: [
          { name: "Networking", color: "#339af0", priority: 1 },
          { name: "WiFi 6", color: "#51cf66", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: false,
      });
    }

    // ========== Other / Accessories (Cáp, keo tản nhiệt) ==========
    const otherCablePower = categoryMap.get("Other Cable Power");
    const otherCableSATA = categoryMap.get("Other Cable SATA");
    const otherCableExtension = categoryMap.get("Other Cable Extension");
    const otherThermalStandard = categoryMap.get(
      "Other Thermal Paste Standard"
    );
    const otherThermalPremium = categoryMap.get("Other Thermal Paste Premium");

    if (otherCablePower && brandMap.has("Corsair")) {
      products.push({
        name: "Corsair Premium PSU Cable Kit (Black)",
        sku: `COR-CAB-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "Bộ dây nguồn Corsair Premium - Sleeved cable, full black, cho PSU modular",
        fullDescription:
          "Corsair Premium Sleeved PSU Cable Kit là bộ dây nguồn bọc lưới cao cấp, màu đen toàn bộ, tương thích PSU Corsair series RM/RMx/HX. Giúp build PC gọn gàng, đẹp hơn.",
        brandId: brandMap.get("Corsair"),
        categoryId: otherCablePower,
        colors: ["black"],
        pricing: {
          originalPrice: 1990000,
          salePrice: 1790000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 10,
        },
        inventory: {
          stock: randomStock(15, 40),
          lowStockThreshold: 8,
          isInStock: true,
        },
        images: createImages("Corsair Premium PSU Cable Kit", 3),
        specifications: {
          model: "CP-8920272",
          partNumber: "CP-8920272",
          warranty: "24 tháng",
          productType: "Hàng chính hãng",
          weight: "500g",
          dimensions: "N/A",
          useCases: ["Gaming", "Đồ họa - Kỹ thuật"],
          hasLED: false,
          ledType: "none",
        },
        seo: {
          slug: generateSlug("Corsair Premium PSU Cable Kit Black"),
          metaTitle: "Corsair Premium PSU Cable Kit - Sleeved cable",
          metaDescription:
            "Bộ dây nguồn Corsair Premium Sleeved Cable Kit, full black, dành cho PSU modular Corsair.",
          metaKeywords: ["Corsair PSU Cable Kit", "sleeved cable", "PSU cable"],
        },
        tags: [
          { name: "Aesthetics", color: "#339af0", priority: 1 },
          { name: "Cable", color: "#51cf66", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: false,
      });
    }

    if (otherCableSATA && brandMap.has("CableMod")) {
      products.push({
        name: "CableMod SATA Cable Kit (Black)",
        sku: `CMD-CAB-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "Bộ dây SATA CableMod - màu đen, mềm, dễ đi dây trong case",
        fullDescription:
          "CableMod SATA Cable Kit gồm nhiều dây SATA bọc sleeved màu đen, mềm, dễ đi dây trong case. Phù hợp khi lắp nhiều ổ HDD/SSD.",
        brandId: brandMap.get("CableMod"),
        categoryId: otherCableSATA,
        colors: ["black"],
        pricing: {
          originalPrice: 499000,
          salePrice: 449000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 10,
        },
        inventory: {
          stock: randomStock(30, 80),
          lowStockThreshold: 15,
          isInStock: true,
        },
        images: createImages("CableMod SATA Cable Kit Black", 3),
        specifications: {
          model: "CM-SATA-KIT-BK",
          partNumber: "CM-SATA-KIT-BK",
          warranty: "12 tháng",
          productType: "Hàng chính hãng",
          weight: "200g",
          dimensions: "N/A",
          useCases: ["Gaming", "Văn phòng"],
          hasLED: false,
          ledType: "none",
        },
        seo: {
          slug: generateSlug("CableMod SATA Cable Kit Black"),
          metaTitle: "CableMod SATA Cable Kit - Dây SATA sleeved",
          metaDescription:
            "Bộ dây SATA CableMod sleeved màu đen, mềm, dễ đi dây cho nhiều ổ HDD/SSD.",
          metaKeywords: ["CableMod", "SATA cable", "PC cable"],
        },
        tags: [
          { name: "Cable", color: "#51cf66", priority: 1 },
          { name: "Accessory", color: "#339af0", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: false,
      });
    }

    if (otherCableExtension && brandMap.has("Lian Li")) {
      products.push({
        name: "Lian Li STRIMER PLUS V2 24-pin RGB Cable",
        sku: `LLI-CAB-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "Dây nối dài 24-pin Lian Li STRIMER PLUS V2 - RGB, dành cho main 24-pin",
        fullDescription:
          "Lian Li STRIMER PLUS V2 24-pin là dây nối dài 24-pin với LED RGB addressable, giúp build PC nổi bật với hiệu ứng ánh sáng đẹp mắt.",
        brandId: brandMap.get("Lian Li"),
        categoryId: otherCableExtension,
        colors: ["rgb"],
        pricing: {
          originalPrice: 1990000,
          salePrice: 1890000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 5,
        },
        inventory: {
          stock: randomStock(10, 30),
          lowStockThreshold: 5,
          isInStock: true,
        },
        images: createImages("Lian Li STRIMER PLUS V2 24-pin", 4),
        specifications: {
          model: "STRIMER PLUS V2 24",
          partNumber: "G89.PW24-V2",
          warranty: "12 tháng",
          productType: "Hàng chính hãng",
          weight: "300g",
          dimensions: "N/A",
          useCases: ["Gaming", "Đồ họa - Kỹ thuật"],
          hasLED: true,
          ledType: "ARGB",
        },
        seo: {
          slug: generateSlug("Lian Li STRIMER PLUS V2 24-pin RGB Cable"),
          metaTitle: "Lian Li STRIMER PLUS V2 - Dây 24-pin RGB",
          metaDescription:
            "Dây nối dài 24-pin Lian Li STRIMER PLUS V2 với LED ARGB, giúp build PC nổi bật.",
          metaKeywords: ["Lian Li STRIMER", "24-pin RGB cable", "ARGB"],
        },
        tags: [
          { name: "RGB", color: "#339af0", priority: 1 },
          { name: "Aesthetics", color: "#ffd43b", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: true,
      });
    }

    if (otherThermalStandard && brandMap.has("Arctic")) {
      products.push({
        name: "Arctic MX-4 Thermal Paste 4g",
        sku: `ARC-THM-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "Keo tản nhiệt Arctic MX-4 4g - Dẫn nhiệt tốt, dễ bôi, không dẫn điện",
        fullDescription:
          "Arctic MX-4 là keo tản nhiệt nổi tiếng với hiệu suất dẫn nhiệt tốt, dễ bôi, không dẫn điện. Phù hợp cho build PC gaming và workstation.",
        brandId: brandMap.get("Arctic"),
        categoryId: otherThermalStandard,
        colors: ["gray"],
        pricing: {
          originalPrice: 249000,
          salePrice: 199000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 20,
        },
        inventory: {
          stock: randomStock(50, 120),
          lowStockThreshold: 25,
          isInStock: true,
        },
        images: createImages("Arctic MX-4 Thermal Paste 4g", 3),
        specifications: {
          model: "MX-4 4g",
          partNumber: "ACTCP00002B",
          warranty: "12 tháng",
          productType: "Hàng chính hãng",
          weight: "4g",
          dimensions: "N/A",
          useCases: ["Gaming", "Văn phòng"],
          hasLED: false,
          ledType: "none",
        },
        seo: {
          slug: generateSlug("Arctic MX-4 Thermal Paste 4g"),
          metaTitle: "Arctic MX-4 4g - Keo tản nhiệt phổ biến",
          metaDescription:
            "Keo tản nhiệt Arctic MX-4 4g, dẫn nhiệt tốt, dễ bôi, không dẫn điện. Lựa chọn phổ biến cho build PC.",
          metaKeywords: ["Arctic MX-4", "thermal paste", "keo tản nhiệt"],
        },
        tags: [
          { name: "Budget", color: "#51cf66", priority: 1 },
          { name: "Cooling", color: "#339af0", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: false,
      });
    }

    if (otherThermalPremium && brandMap.has("Thermal Grizzly")) {
      products.push({
        name: "Thermal Grizzly Kryonaut Extreme 2g",
        sku: `THG-THM-${skuCounter++}`,
        barcode: `880609${skuCounter}`,
        shortDescription:
          "Keo tản nhiệt Thermal Grizzly Kryonaut Extreme - hiệu suất cực cao",
        fullDescription:
          "Thermal Grizzly Kryonaut Extreme là keo tản nhiệt hiệu suất cực cao, thường dùng cho overclocking, custom loop. Dẫn nhiệt rất tốt, phù hợp CPU/GPU high-end.",
        brandId: brandMap.get("Thermal Grizzly"),
        categoryId: otherThermalPremium,
        colors: ["gray"],
        pricing: {
          originalPrice: 599000,
          salePrice: 549000,
          currency: "VND",
          isOnSale: true,
          discountPercent: 8,
        },
        inventory: {
          stock: randomStock(15, 40),
          lowStockThreshold: 8,
          isInStock: true,
        },
        images: createImages("Thermal Grizzly Kryonaut Extreme 2g", 3),
        specifications: {
          model: "Kryonaut Extreme 2g",
          partNumber: "TG-KE-002-R",
          warranty: "12 tháng",
          productType: "Hàng chính hãng",
          weight: "2g",
          dimensions: "N/A",
          useCases: ["Gaming", "Đồ họa - Kỹ thuật"],
          hasLED: false,
          ledType: "none",
        },
        seo: {
          slug: generateSlug("Thermal Grizzly Kryonaut Extreme 2g"),
          metaTitle: "Thermal Grizzly Kryonaut Extreme - Keo tản nhiệt cao cấp",
          metaDescription:
            "Keo tản nhiệt Thermal Grizzly Kryonaut Extreme 2g, hiệu suất cực cao cho overclocking và build PC high-end.",
          metaKeywords: [
            "Thermal Grizzly",
            "Kryonaut Extreme",
            "thermal paste",
          ],
        },
        tags: [
          { name: "Premium", color: "#ffd43b", priority: 1 },
          { name: "Overclocking", color: "#ff6b6b", priority: 2 },
        ],
        status: "published",
        isActive: true,
        isFeatured: true,
      });
    }

    console.log(`\n📦 Prepared ${products.length} products to seed...`);

    // Insert products in batches
    const batchSize = 20;
    let inserted = 0;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      await Product.insertMany(batch);
      inserted += batch.length;
      console.log(`✓ Inserted batch: ${inserted}/${products.length} products`);
    }

    console.log(`\n✅ Successfully seeded ${inserted} products!`);

    // Statistics
    const publishedCount = await Product.countDocuments({
      status: "published",
    });
    const featuredCount = await Product.countDocuments({ isFeatured: true });
    const onSaleCount = await Product.countDocuments({
      "pricing.isOnSale": true,
    });

    console.log(`\n📊 Statistics:`);
    console.log(`   - Published: ${publishedCount}`);
    console.log(`   - Featured: ${featuredCount}`);
    console.log(`   - On Sale: ${onSaleCount}`);

    // Close connection
    await mongoose.connection.close();
    console.log("\n🔌 Connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding products:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the seed function
seedProducts();
