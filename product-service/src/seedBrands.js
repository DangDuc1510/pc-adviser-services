const mongoose = require("mongoose");
const config = require("./config/env");
const Brand = require("./models/brand.model");

// Helper function to generate slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Brand data
const brandsData = [
  {
    name: "ASUS",
    description:
      "ASUS is a Taiwanese multinational computer hardware and consumer electronics company. Known for high-quality motherboards, graphics cards, laptops, and gaming equipment.",
    country: "Taiwan",
    logo: "https://logos-world.net/wp-content/uploads/2020/11/ASUS-Logo.png",
    metaTitle: "ASUS - Premium Computer Hardware & Gaming Equipment",
    metaDescription:
      "Discover ASUS products including gaming laptops, motherboards, graphics cards, and more. Leading innovation in computer hardware.",
    metaKeywords: [
      "ASUS",
      "gaming laptop",
      "motherboard",
      "graphics card",
      "ROG",
      "computer hardware",
    ],
  },
  {
    name: "MSI",
    description:
      "Micro-Star International (MSI) is a Taiwanese multinational information technology corporation. Specializes in gaming laptops, motherboards, graphics cards, and gaming peripherals.",
    country: "Taiwan",
    logo: "https://logos-world.net/wp-content/uploads/2020/11/MSI-Logo.png",
    metaTitle: "MSI - Gaming Laptops & Hardware",
    metaDescription:
      "MSI gaming laptops, motherboards, and graphics cards. Premium gaming hardware for enthusiasts and professionals.",
    metaKeywords: [
      "MSI",
      "gaming laptop",
      "gaming PC",
      "motherboard",
      "graphics card",
      "gaming hardware",
    ],
  },
  {
    name: "Dell",
    description:
      "Dell Technologies is an American multinational technology company. Known for reliable business laptops, desktops, workstations, and enterprise solutions.",
    country: "United States",
    logo: "https://logos-world.net/wp-content/uploads/2020/06/Dell-Logo.png",
    metaTitle: "Dell - Business Laptops & Enterprise Solutions",
    metaDescription:
      "Dell laptops, desktops, and enterprise solutions. Trusted by businesses worldwide for reliability and performance.",
    metaKeywords: [
      "Dell",
      "business laptop",
      "XPS",
      "Alienware",
      "workstation",
      "enterprise",
    ],
  },
  {
    name: "HP",
    description:
      "HP Inc. is an American multinational information technology company. Offers a wide range of laptops, desktops, printers, and accessories for consumers and businesses.",
    country: "United States",
    logo: "https://logos-world.net/wp-content/uploads/2020/06/HP-Logo.png",
    metaTitle: "HP - Laptops, Desktops & Printers",
    metaDescription:
      "HP laptops, desktops, and printers for home and business. Innovation and reliability you can count on.",
    metaKeywords: [
      "HP",
      "laptop",
      "desktop",
      "printer",
      "Pavilion",
      "EliteBook",
      "Spectre",
    ],
  },
  {
    name: "Lenovo",
    description:
      "Lenovo is a Chinese multinational technology company. Known for ThinkPad business laptops, IdeaPad consumer laptops, and Legion gaming series.",
    country: "China",
    logo: "https://logos-world.net/wp-content/uploads/2020/06/Lenovo-Logo.png",
    metaTitle: "Lenovo - ThinkPad, IdeaPad & Legion Gaming",
    metaDescription:
      "Lenovo laptops including ThinkPad for business, IdeaPad for consumers, and Legion for gaming. Quality and innovation.",
    metaKeywords: [
      "Lenovo",
      "ThinkPad",
      "IdeaPad",
      "Legion",
      "business laptop",
      "gaming laptop",
    ],
  },
  {
    name: "Acer",
    description:
      "Acer Inc. is a Taiwanese multinational hardware and electronics corporation. Offers affordable laptops, desktops, monitors, and gaming equipment including Predator series.",
    country: "Taiwan",
    logo: "https://logos-world.net/wp-content/uploads/2020/06/Acer-Logo.png",
    metaTitle: "Acer - Laptops, Desktops & Gaming Equipment",
    metaDescription:
      "Acer laptops, desktops, and gaming equipment. Affordable technology for everyone, from students to gamers.",
    metaKeywords: [
      "Acer",
      "laptop",
      "desktop",
      "Predator",
      "Nitro",
      "gaming",
      "affordable laptop",
    ],
  },
  {
    name: "Apple",
    description:
      "Apple Inc. is an American multinational technology company. Known for MacBook laptops, iMac desktops, and premium design with macOS ecosystem.",
    country: "United States",
    logo: "https://logos-world.net/wp-content/uploads/2020/04/Apple-Logo.png",
    metaTitle: "Apple - MacBook & iMac Computers",
    metaDescription:
      "Apple MacBook laptops and iMac desktops. Premium design, powerful performance, and seamless macOS integration.",
    metaKeywords: [
      "Apple",
      "MacBook",
      "iMac",
      "Mac",
      "macOS",
      "premium laptop",
      "Apple computer",
    ],
  },
  {
    name: "Razer",
    description:
      "Razer Inc. is a Singaporean-American multinational technology company. Specializes in high-end gaming laptops, peripherals, and accessories for gamers.",
    country: "Singapore",
    logo: "https://logos-world.net/wp-content/uploads/2020/11/Razer-Logo.png",
    metaTitle: "Razer - Gaming Laptops & Peripherals",
    metaDescription:
      "Razer gaming laptops, keyboards, mice, and accessories. Built for gamers, by gamers. Premium gaming experience.",
    metaKeywords: [
      "Razer",
      "gaming laptop",
      "Blade",
      "gaming peripherals",
      "gaming mouse",
      "gaming keyboard",
    ],
  },
  {
    name: "Gigabyte",
    description:
      "Gigabyte Technology is a Taiwanese manufacturer and distributor of computer hardware. Known for motherboards, graphics cards, laptops, and gaming components.",
    country: "Taiwan",
    logo: "https://logos-world.net/wp-content/uploads/2020/11/Gigabyte-Logo.png",
    metaTitle: "Gigabyte - Motherboards, Graphics Cards & Laptops",
    metaDescription:
      "Gigabyte motherboards, graphics cards, and laptops. High-performance components for gaming and professional use.",
    metaKeywords: [
      "Gigabyte",
      "motherboard",
      "graphics card",
      "AORUS",
      "gaming laptop",
      "PC components",
    ],
  },
  {
    name: "Alienware",
    description:
      "Alienware is an American computer hardware subsidiary of Dell. Specializes in high-performance gaming laptops and desktops with distinctive design.",
    country: "United States",
    logo: "https://logos-world.net/wp-content/uploads/2020/11/Alienware-Logo.png",
    metaTitle: "Alienware - Premium Gaming Laptops & Desktops",
    metaDescription:
      "Alienware gaming laptops and desktops. Extreme performance, cutting-edge design, and immersive gaming experience.",
    metaKeywords: [
      "Alienware",
      "gaming laptop",
      "gaming desktop",
      "premium gaming",
      "Dell Alienware",
    ],
  },
  {
    name: "Samsung",
    description:
      "Samsung Electronics is a South Korean multinational electronics corporation. Offers Galaxy Book laptops and monitors with innovative features.",
    country: "South Korea",
    logo: "https://logos-world.net/wp-content/uploads/2020/06/Samsung-Logo.png",
    metaTitle: "Samsung - Galaxy Book Laptops & Monitors",
    metaDescription:
      "Samsung Galaxy Book laptops and monitors. Innovation meets style with cutting-edge technology and premium design.",
    metaKeywords: [
      "Samsung",
      "Galaxy Book",
      "laptop",
      "monitor",
      "Samsung computer",
    ],
  },
  {
    name: "LG",
    description:
      "LG Electronics is a South Korean multinational electronics company. Known for Gram series ultra-lightweight laptops and high-quality monitors.",
    country: "South Korea",
    logo: "https://logos-world.net/wp-content/uploads/2020/06/LG-Logo.png",
    metaTitle: "LG - Gram Laptops & Monitors",
    metaDescription:
      "LG Gram ultra-lightweight laptops and monitors. Perfect balance of portability, performance, and battery life.",
    metaKeywords: [
      "LG",
      "Gram",
      "ultra-lightweight laptop",
      "LG monitor",
      "portable laptop",
    ],
  },
  {
    name: "Microsoft",
    description:
      "Microsoft Corporation is an American multinational technology company. Known for Surface line of laptops and tablets running Windows.",
    country: "United States",
    logo: "https://logos-world.net/wp-content/uploads/2020/06/Microsoft-Logo.png",
    metaTitle: "Microsoft - Surface Laptops & Tablets",
    metaDescription:
      "Microsoft Surface laptops and tablets. Premium design, Windows integration, and productivity-focused features.",
    metaKeywords: [
      "Microsoft",
      "Surface",
      "Surface Laptop",
      "Surface Pro",
      "Windows laptop",
    ],
  },
  {
    name: "ASRock",
    description:
      "ASRock is a Taiwanese manufacturer of motherboards, graphics cards, and mini PCs. Known for affordable and reliable PC components.",
    country: "Taiwan",
    logo: "https://logos-world.net/wp-content/uploads/2020/11/ASRock-Logo.png",
    metaTitle: "ASRock - Motherboards & PC Components",
    metaDescription:
      "ASRock motherboards, graphics cards, and mini PCs. Quality components at competitive prices.",
    metaKeywords: [
      "ASRock",
      "motherboard",
      "graphics card",
      "mini PC",
      "PC components",
    ],
  },
  {
    name: "EVGA",
    description:
      "EVGA Corporation is an American computer hardware company. Specializes in NVIDIA graphics cards, power supplies, and gaming components.",
    country: "United States",
    logo: "https://logos-world.net/wp-content/uploads/2020/11/EVGA-Logo.png",
    metaTitle: "EVGA - Graphics Cards & Power Supplies",
    metaDescription:
      "EVGA NVIDIA graphics cards and power supplies. Premium gaming components with excellent customer support.",
    metaKeywords: [
      "EVGA",
      "graphics card",
      "NVIDIA",
      "power supply",
      "gaming components",
    ],
  },
  {
    name: "Intel",
    description:
      "Intel Corporation is an American multinational technology corporation. World leader in CPU manufacturing, producing processors for desktops, laptops, servers, and mobile devices.",
    country: "United States",
    logo: "https://logos-world.net/wp-content/uploads/2020/04/Intel-Logo.png",
    metaTitle: "Intel - Processors & CPUs",
    metaDescription:
      "Intel processors including Core i3, i5, i7, i9 and Xeon series. Leading CPU technology for all computing needs.",
    metaKeywords: [
      "Intel",
      "CPU",
      "processor",
      "Core i5",
      "Core i7",
      "Core i9",
    ],
  },
  {
    name: "AMD",
    description:
      "Advanced Micro Devices (AMD) is an American multinational semiconductor company. Known for Ryzen CPUs and Radeon graphics cards, offering excellent performance-to-price ratio.",
    country: "United States",
    logo: "https://logos-world.net/wp-content/uploads/2020/06/AMD-Logo.png",
    metaTitle: "AMD - Processors & Graphics Cards",
    metaDescription:
      "AMD Ryzen processors and Radeon graphics cards. High performance CPUs and GPUs for gaming and content creation.",
    metaKeywords: ["AMD", "Ryzen", "Radeon", "CPU", "GPU", "processor"],
  },
  {
    name: "Corsair",
    description:
      "Corsair is an American computer peripherals and hardware company. Specializes in RAM, PSU, cooling solutions, cases, keyboards, and gaming peripherals.",
    country: "United States",
    logo: "https://logos-world.net/wp-content/uploads/2020/11/Corsair-Logo.png",
    metaTitle: "Corsair - RAM, PSU, Cooling & Peripherals",
    metaDescription:
      "Corsair RAM, power supplies, CPU coolers, cases, and gaming peripherals. Premium quality components for PC enthusiasts.",
    metaKeywords: ["Corsair", "RAM", "PSU", "cooling", "Vengeance", "iCUE"],
  },
  {
    name: "G.Skill",
    description:
      "G.Skill International is a Taiwanese computer hardware manufacturer. Specializes in high-performance RAM modules, particularly known for Trident and Ripjaws series.",
    country: "Taiwan",
    logo: "https://logos-world.net/wp-content/uploads/2020/11/G.Skill-Logo.png",
    metaTitle: "G.Skill - High Performance RAM",
    metaDescription:
      "G.Skill RAM modules including Trident Z, Ripjaws, and Aegis series. High-performance memory for gaming and overclocking.",
    metaKeywords: ["G.Skill", "RAM", "Trident Z", "Ripjaws", "DDR4", "DDR5"],
  },
  {
    name: "Noctua",
    description:
      "Noctua is an Austrian computer hardware company. Specializes in premium CPU coolers and case fans, known for excellent cooling performance and quiet operation.",
    country: "Austria",
    logo: "https://logos-world.net/wp-content/uploads/2020/11/Noctua-Logo.png",
    metaTitle: "Noctua - Premium CPU Coolers & Fans",
    metaDescription:
      "Noctua CPU coolers and case fans. Premium cooling solutions with excellent performance and whisper-quiet operation.",
    metaKeywords: ["Noctua", "CPU cooler", "case fan", "cooling", "NH-D15"],
  },
  {
    name: "NZXT",
    description:
      "NZXT is an American computer hardware company. Known for PC cases, CPU coolers, and RGB lighting solutions with modern, minimalist design.",
    country: "United States",
    logo: "https://logos-world.net/wp-content/uploads/2020/11/NZXT-Logo.png",
    metaTitle: "NZXT - PC Cases & Cooling Solutions",
    metaDescription:
      "NZXT PC cases, CPU coolers, and RGB lighting. Modern design with excellent build quality and aesthetics.",
    metaKeywords: ["NZXT", "PC case", "CPU cooler", "AIO", "H7", "Kraken"],
  },
  {
    name: "Seasonic",
    description:
      "Seasonic is a Taiwanese power supply manufacturer. Known for high-quality, reliable PSUs with excellent efficiency ratings and long warranties.",
    country: "Taiwan",
    logo: "https://logos-world.net/wp-content/uploads/2020/11/Seasonic-Logo.png",
    metaTitle: "Seasonic - Power Supplies",
    metaDescription:
      "Seasonic power supplies with 80 Plus Gold, Platinum, and Titanium ratings. Premium quality PSUs with long warranties.",
    metaKeywords: [
      "Seasonic",
      "PSU",
      "power supply",
      "80 Plus Gold",
      "Focus",
      "Prime",
    ],
  },
  {
    name: "Western Digital",
    description:
      "Western Digital Corporation is an American computer data storage company. Manufactures HDDs, SSDs, and storage solutions under WD and SanDisk brands.",
    country: "United States",
    logo: "https://logos-world.net/wp-content/uploads/2020/06/Western-Digital-Logo.png",
    metaTitle: "Western Digital - Storage Solutions",
    metaDescription:
      "Western Digital HDDs and SSDs including WD Black, Blue, Red series. Reliable storage solutions for all needs.",
    metaKeywords: [
      "Western Digital",
      "WD",
      "HDD",
      "SSD",
      "storage",
      "WD Black",
      "WD Blue",
    ],
  },
];

async function seedBrands() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGO_URI, {
      dbName: config.MONGODB_DB_NAME,
    });
    console.log("✅ Connected to MongoDB");

    // Clear existing brands (optional - comment out if you want to keep existing data)
    const existingBrands = await Brand.countDocuments();
    if (existingBrands > 0) {
      console.log(`\n⚠️  Found ${existingBrands} existing brands. Clearing...`);
      await Brand.deleteMany({});
      console.log("✅ Cleared existing brands");
    }

    // Generate slugs and prepare data
    const brandsToInsert = brandsData.map((brand) => ({
      ...brand,
      slug: generateSlug(brand.name),
      isActive: true,
    }));

    // Insert brands
    const result = await Brand.insertMany(brandsToInsert);
    console.log(`\n✅ Successfully seeded ${result.length} brands:`);

    result.forEach((brand) => {
      console.log(`   - ${brand.name} (${brand.slug})`);
    });

    console.log("\n✅ Brand seeding completed!");

    // Close connection
    await mongoose.connection.close();
    console.log("🔌 Connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding brands:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the seed function
seedBrands();
