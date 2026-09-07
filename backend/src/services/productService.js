const prisma = require("../lib/prisma");

// Converts Prisma Decimal values into regular numbers for API responses.
function serializeProduct(product) {
   if (!product) {
      return null;
   }

   return {
      ...product,
      price: Number(product.price)
   };
}

async function getAllProducts(includeInactive) {
   // Return active products unless inactive products are explicitly requested.
   const products = await prisma.product.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { createdAt: "desc" }
   });

   return products.map(serializeProduct);
}

async function getProductById(id) {
   const product = await prisma.product.findUnique({
      where: { id }
   });

   return serializeProduct(product);
}

async function createProduct(productData) {
   const product = await prisma.product.create({
      data: productData
   });

   return serializeProduct(product);
}

async function updateProduct(id, productData) {
   // Check existence so callers can return a clear 404 response.
   const existingProduct = await prisma.product.findUnique({
      where: { id }
   });

   if (!existingProduct) {
      return null;
   }

   const product = await prisma.product.update({
      where: { id },
      data: productData
   });

   return serializeProduct(product);
}

async function deleteProduct(id) {
   // Soft-delete products so historical recommendations can still reference them.
   const existingProduct = await prisma.product.findUnique({
      where: { id }
   });

   if (!existingProduct) {
      return null;
   }

   const product = await prisma.product.update({
      where: { id },
      data: { isActive: false }
   });

   return serializeProduct(product);
}

module.exports = {
   getAllProducts,
   getProductById,
   createProduct,
   updateProduct,
   deleteProduct
};
