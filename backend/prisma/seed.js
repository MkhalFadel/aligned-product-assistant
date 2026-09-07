const prisma = require("../src/lib/prisma");

// Seeds the initial hardware catalogue without creating duplicate products.
const products = [
   {
      name: "ASUS ROG Zephyrus G14",
      description: "A compact 14-inch gaming laptop with premium portability and modern AAA gaming performance.",
      price: 1699.99,
      imageUrl: "https://placehold.co/1200x900/png?text=ASUS+ROG+Zephyrus+G14",
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
         recommendedUse: "Gaming and content creation"
      },
      isActive: true
   },
   {
      name: "Alienware Aurora R16",
      description: "A performance desktop PC designed for high-refresh-rate gaming and demanding creative workloads.",
      price: 2199.99,
      imageUrl: "https://placehold.co/1200x900/png?text=Alienware+Aurora+R16",
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
      name: "LG UltraGear 27GS95QE-B",
      description: "A 27-inch OLED gaming monitor with deep contrast, rich color, and an ultra-fast refresh rate.",
      price: 799.99,
      imageUrl: "https://placehold.co/1200x900/png?text=LG+UltraGear+27GS95QE-B",
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
      name: "Keychron Q1 Max",
      description: "A customizable 75 percent mechanical keyboard with a premium aluminum body and versatile wireless connectivity.",
      price: 219,
      imageUrl: "https://placehold.co/1200x900/png?text=Keychron+Q1+Max",
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
      name: "Xbox Wireless Controller",
      description: "An ergonomic controller for console, PC, and mobile play with textured grips and broad compatibility.",
      price: 64.99,
      imageUrl: "https://placehold.co/1200x900/png?text=Xbox+Wireless+Controller",
      category: "controllers",
      attributes: {
         brand: "Microsoft",
         platformCompatibility: "Xbox Series X|S, Xbox One, Windows, Android, and iOS",
         connectionType: "Xbox Wireless, Bluetooth, and USB-C",
         batteryLife: "Up to 40 hours with AA batteries",
         features: ["Textured grip", "Hybrid D-pad", "3.5mm headset jack"]
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
