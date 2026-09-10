const prisma = require("../src/lib/prisma");

// Seeds the initial hardware catalogue without creating duplicate products.
// Local product assets avoid depending on third-party image hotlinks at runtime.
const products = [
   // Laptops cover budget, portable, business, gaming, and creative work.
   {
      name: "ASUS ROG Zephyrus G14",
      description: "A compact 14-inch gaming laptop with premium portability and modern AAA gaming performance.",
      price: 1699.99,
      imageUrl: "/product-images/asus-rog-zephyrus-g14.jpg",
      category: "laptops",
      attributes: {
         brand: "ASUS",
         processor: "AMD Ryzen 9 8945HS",
         gpu: "NVIDIA GeForce RTX 4070 Laptop GPU",
         ram: "32GB LPDDR5X",
         storage: "1TB PCIe 4.0 SSD",
         display: "14-inch OLED, 2880 x 1800",
         refreshRate: "120Hz",
         batteryLife: "Up to 10 hours",
         weight: "1.5kg",
         recommendedUse: "Portable gaming, content creation, and premium everyday use"
      },
      isActive: true
   },
   {
      name: "Apple MacBook Air 13-inch (M3)",
      description: "A light, quiet laptop with a 13.6-inch display, 16GB of unified memory, and all-day battery life for study and everyday work.",
      price: 1499.99,
      imageUrl: "/product-images/apple-macbook-air-m3.jpg",
      category: "laptops",
      attributes: {
         brand: "Apple",
         processor: "Apple M3 8-core CPU",
         gpu: "Apple 10-core GPU",
         ram: "16GB unified memory",
         storage: "512GB SSD",
         display: "13.6-inch Liquid Retina, 2560 x 1664",
         refreshRate: "60Hz",
         batteryLife: "Up to 18 hours",
         weight: "1.24kg",
         recommendedUse: "University, programming, portability, and everyday productivity"
      },
      isActive: true
   },
   {
      name: "Lenovo ThinkPad X1 Carbon Gen 12",
      description: "A lightweight business laptop with a durable 14-inch design, ample memory, and a comfortable keyboard for work on the move.",
      price: 1699.99,
      imageUrl: "/product-images/lenovo-thinkpad-x1-carbon-gen12.png",
      category: "laptops",
      attributes: {
         brand: "Lenovo",
         processor: "Intel Core Ultra 7 155H",
         gpu: "Intel Arc Graphics",
         ram: "32GB LPDDR5X",
         storage: "1TB SSD",
         display: "14-inch IPS, 1920 x 1200",
         refreshRate: "60Hz",
         batteryLife: "Up to 15 hours",
         weight: "1.09kg",
         recommendedUse: "Business, travel, programming, and productivity"
      },
      isActive: true
   },
   {
      name: "Dell Inspiron 14 Plus 7440",
      description: "A 14-inch performance laptop with a sharp 2.2K display, modern Intel graphics, and enough memory for programming and multitasking.",
      price: 1099.99,
      imageUrl: "/product-images/dell-inspiron-14-plus-7440.jpg",
      category: "laptops",
      attributes: {
         brand: "Dell",
         processor: "Intel Core Ultra 7 155H",
         gpu: "Intel Arc Graphics",
         ram: "16GB LPDDR5X",
         storage: "1TB SSD",
         display: "14-inch, 2240 x 1400",
         refreshRate: "60Hz",
         batteryLife: "Up to 10 hours",
         weight: "1.6kg",
         recommendedUse: "University, programming, multitasking, and light creative work"
      },
      isActive: true
   },
   {
      name: "Acer Aspire 5 A515-58M",
      description: "An affordable 15.6-inch laptop with 16GB of memory and a 512GB SSD for web use, documents, and entry-level programming.",
      price: 649.99,
      imageUrl: "/product-images/acer-aspire-5-a515-58m.jpg",
      category: "laptops",
      attributes: {
         brand: "Acer",
         processor: "Intel Core i5-1335U",
         gpu: "Intel Iris Xe Graphics",
         ram: "16GB DDR4",
         storage: "512GB SSD",
         display: "15.6-inch IPS, 1920 x 1080",
         refreshRate: "60Hz",
         batteryLife: "Up to 8 hours",
         weight: "1.8kg",
         recommendedUse: "Budget university work, web use, documents, and entry-level programming"
      },
      isActive: true
   },
   {
      name: "Lenovo Legion 5i 16 Gen 9",
      description: "A 16-inch gaming laptop with an RTX 4060, a 165Hz display, and a capable processor for modern games and demanding projects.",
      price: 1499.99,
      imageUrl: "/product-images/lenovo-legion-5i-gen9.png",
      category: "laptops",
      attributes: {
         brand: "Lenovo",
         processor: "Intel Core i7-14650HX",
         gpu: "NVIDIA GeForce RTX 4060 Laptop GPU",
         ram: "16GB DDR5",
         storage: "1TB SSD",
         display: "16-inch IPS, 2560 x 1600",
         refreshRate: "165Hz",
         batteryLife: "Up to 6 hours",
         weight: "2.3kg",
         recommendedUse: "Gaming, 3D work, engineering software, and content creation"
      },
      isActive: true
   },
   {
      name: "HP Spectre x360 14",
      description: "A premium 2-in-1 laptop with a 14-inch OLED touchscreen, long battery life, and a light design for flexible work and creative tasks.",
      price: 1599.99,
      imageUrl: "/product-images/hp-spectre-x360-14.jpg",
      category: "laptops",
      attributes: {
         brand: "HP",
         processor: "Intel Core Ultra 7 155H",
         gpu: "Intel Arc Graphics",
         ram: "16GB LPDDR5X",
         storage: "1TB SSD",
         display: "14-inch OLED touchscreen, 2880 x 1800",
         refreshRate: "120Hz",
         batteryLife: "Up to 13 hours",
         weight: "1.4kg",
         recommendedUse: "Portability, business, note-taking, and light creative work"
      },
      isActive: true
   },
   {
      name: "Dell XPS 16 9640",
      description: "A premium 16-inch laptop with dedicated RTX graphics, 32GB of memory, and a spacious display for creative applications and advanced coding.",
      price: 2299.99,
      imageUrl: "/product-images/dell-xps-16-9640.png",
      category: "laptops",
      attributes: {
         brand: "Dell",
         processor: "Intel Core Ultra 7 155H",
         gpu: "NVIDIA GeForce RTX 4050 Laptop GPU",
         ram: "32GB LPDDR5X",
         storage: "1TB SSD",
         display: "16.3-inch, 1920 x 1200",
         refreshRate: "120Hz",
         batteryLife: "Up to 13 hours",
         weight: "2.13kg",
         recommendedUse: "Content creation, advanced programming, and premium productivity"
      },
      isActive: true
   },
   // Desktop PCs provide distinct options from entry-level gaming to creative work.
   {
      name: "Alienware Aurora R16",
      description: "A performance desktop PC designed for high-refresh-rate gaming and demanding creative workloads.",
      price: 2199.99,
      imageUrl: "/product-images/alienware-aurora-r16.jpg",
      category: "desktop PCs",
      attributes: {
         brand: "Alienware",
         processor: "Intel Core i7-14700F",
         gpu: "NVIDIA GeForce RTX 4070 SUPER",
         ram: "32GB DDR5",
         storage: "2TB NVMe SSD",
         powerSupply: "1000W 80 Plus Gold",
         recommendedUse: "High-end gaming and video editing"
      },
      isActive: true
   },
   {
      name: "HP Victus 15L TG02",
      description: "An entry-level gaming desktop with an RTX 4060, 16GB of memory, and a compact tower for 1080p gaming and everyday work.",
      price: 899.99,
      imageUrl: "/product-images/hp-victus-15l-tg02.jpg",
      category: "desktop PCs",
      attributes: {
         brand: "HP",
         processor: "AMD Ryzen 5 5600G",
         gpu: "NVIDIA GeForce RTX 4060",
         ram: "16GB DDR4",
         storage: "512GB NVMe SSD",
         powerSupply: "500W 80 Plus Bronze",
         recommendedUse: "Budget 1080p gaming, schoolwork, and everyday use"
      },
      isActive: true
   },
   {
      name: "Lenovo Legion Tower 5i Gen 8",
      description: "A balanced gaming desktop with an RTX 4070, 32GB of memory, and fast storage for 1440p gaming and streaming.",
      price: 1599.99,
      imageUrl: "/product-images/lenovo-legion-tower-5i-gen8.png",
      category: "desktop PCs",
      attributes: {
         brand: "Lenovo",
         processor: "Intel Core i7-13700F",
         gpu: "NVIDIA GeForce RTX 4070",
         ram: "32GB DDR5",
         storage: "1TB NVMe SSD",
         powerSupply: "650W 80 Plus Gold",
         recommendedUse: "1440p gaming, streaming, and content creation"
      },
      isActive: true
   },
   {
      name: "Dell XPS Desktop 8960",
      description: "A productivity-focused desktop with a Core i7 processor, RTX 4060 Ti graphics, and 32GB of memory for editing and demanding office work.",
      price: 1799.99,
      imageUrl: "/product-images/dell-xps-desktop-8960.jpg",
      category: "desktop PCs",
      attributes: {
         brand: "Dell",
         processor: "Intel Core i7-13700",
         gpu: "NVIDIA GeForce RTX 4060 Ti",
         ram: "32GB DDR5",
         storage: "1TB NVMe SSD",
         powerSupply: "750W 80 Plus Platinum",
         recommendedUse: "Productivity, programming, photo editing, and video editing"
      },
      isActive: true
   },
   {
      name: "Apple Mac mini (M2 Pro)",
      description: "A compact desktop with Apple silicon, 16GB of unified memory, and fast storage for programming, creative apps, and quiet office use.",
      price: 1299.99,
      imageUrl: "/product-images/apple-mac-mini-m2-pro.png",
      category: "desktop PCs",
      attributes: {
         brand: "Apple",
         processor: "Apple M2 Pro 10-core CPU",
         gpu: "Apple 16-core GPU",
         ram: "16GB unified memory",
         storage: "512GB SSD",
         powerSupply: "185W built-in power supply",
         recommendedUse: "Programming, creative work, and quiet desktop productivity"
      },
      isActive: true
   },
   // Monitors include affordable productivity, high-refresh gaming, and OLED gaming.
   {
      name: "LG UltraGear 27GS95QE-B",
      description: "A 27-inch OLED gaming monitor with deep contrast, rich color, and an ultra-fast refresh rate.",
      price: 799.99,
      imageUrl: "/product-images/lg-ultragear-27gs95qe-b.jpg",
      category: "monitors",
      attributes: {
         brand: "LG",
         size: "27-inch",
         resolution: "2560 x 1440",
         refreshRate: "240Hz",
         panelType: "OLED",
         responseTime: "0.03ms GtG"
      },
      isActive: true
   },
   {
      name: "Dell S2722QC",
      description: "A 27-inch 4K monitor with an IPS panel and USB-C connectivity for clear text, productivity, and general media use.",
      price: 329.99,
      imageUrl: "/product-images/dell-s2722qc.png",
      category: "monitors",
      attributes: {
         brand: "Dell",
         size: "27-inch",
         resolution: "3840 x 2160",
         refreshRate: "60Hz",
         panelType: "IPS",
         responseTime: "4ms GtG"
      },
      isActive: true
   },
   {
      name: "ASUS TUF Gaming VG27AQ3A",
      description: "A 27-inch 1440p gaming monitor with a Fast IPS panel, 180Hz refresh rate, and quick response time for competitive play.",
      price: 299.99,
      imageUrl: "/product-images/asus-tuf-gaming-vg27aq3a.jpg",
      category: "monitors",
      attributes: {
         brand: "ASUS",
         size: "27-inch",
         resolution: "2560 x 1440",
         refreshRate: "180Hz",
         panelType: "Fast IPS",
         responseTime: "1ms GtG"
      },
      isActive: true
   },
   // Keyboards distinguish productivity-oriented and gaming-oriented mechanical options.
   {
      name: "Keychron Q1 Max",
      description: "A customizable 75 percent mechanical keyboard with a premium aluminum body and versatile wireless connectivity.",
      price: 219,
      imageUrl: "/product-images/keychron-q1-max.jpg",
      category: "keyboards",
      attributes: {
         brand: "Keychron",
         connectionType: "Wired USB-C, Bluetooth, and 2.4GHz wireless",
         switchType: "Gateron Jupiter Red",
         layout: "ANSI 75 percent",
         backlight: "South-facing RGB"
      },
      isActive: true
   },
   {
      name: "Logitech G PRO X TKL LIGHTSPEED",
      description: "A tenkeyless gaming mechanical keyboard with wireless connectivity, tactile switches, and RGB lighting for competitive play.",
      price: 199.99,
      imageUrl: "/product-images/logitech-g-pro-x-tkl-lightspeed.png",
      category: "keyboards",
      attributes: {
         brand: "Logitech",
         connectionType: "LIGHTSPEED wireless, Bluetooth, and USB-C",
         switchType: "GX Brown Tactile",
         layout: "TKL",
         backlight: "LIGHTSYNC RGB"
      },
      isActive: true
   },
   // Controllers support different ecosystems while retaining PC-friendly options.
   {
      name: "Xbox Wireless Controller",
      description: "An ergonomic controller for console, PC, and mobile play with textured grips and broad compatibility.",
      price: 64.99,
      imageUrl: "/product-images/xbox-wireless-controller.png",
      category: "controllers",
      attributes: {
         brand: "Microsoft",
         platformCompatibility: "Xbox Series X|S, Xbox One, Windows, Android, and iOS",
         connectionType: "Xbox Wireless, Bluetooth, and USB-C",
         batteryLife: "Up to 40 hours with AA batteries",
         features: ["Textured grip", "Hybrid D-pad", "3.5mm headset jack"]
      },
      isActive: true
   },
   {
      name: "Sony DualSense Wireless Controller",
      description: "A wireless controller for PlayStation 5 and compatible PC or mobile games, with haptic feedback and adaptive triggers in supported titles.",
      price: 74.99,
      imageUrl: "/product-images/sony-dualsense-wireless-controller.jpeg",
      category: "controllers",
      attributes: {
         brand: "Sony",
         platformCompatibility: "PlayStation 5, Windows, macOS, Android, and iOS",
         connectionType: "Bluetooth and USB-C",
         batteryLife: "Up to 12 hours",
         features: ["Haptic feedback", "Adaptive triggers", "Built-in microphone"]
      },
      isActive: true
   }
];

async function seedProducts() {
   for (const productData of products) {
      // Match by name so rerunning the seed refreshes the sample product.
      const existingProduct = await prisma.product.findFirst({
         where: { name: productData.name }
      });

      if (existingProduct) {
         await prisma.product.update({
            where: { id: existingProduct.id },
            data: productData
         });
      } else {
         await prisma.product.create({
            data: productData
         });
      }
   }
}

seedProducts()
   .then(() => {
      console.log("Product seed completed successfully.");
   })
   .catch((error) => {
      console.error("Product seed failed:", error);
      process.exitCode = 1;
   })
   .finally(async () => {
      // Close the shared client after the seed completes.
      await prisma.$disconnect();
   });
