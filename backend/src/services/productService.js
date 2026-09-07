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

async function activateProduct(id) {
   const existingProduct = await prisma.product.findUnique({
      where: { id }
   });

   if (!existingProduct) {
      return null;
   }

   if (existingProduct.isActive) {
      return serializeProduct(existingProduct);
   }

   const product = await prisma.product.update({
      where: { id },
      data: { isActive: true }
   });

   return serializeProduct(product);
}

async function permanentlyDeleteProduct(id) {
   const existingProduct = await prisma.product.findUnique({
      where: { id }
   });

   if (!existingProduct) {
      return null;
   }

   // Preserve recommendation history by blocking permanent deletion when referenced.
   const recommendation = await prisma.recommendation.findFirst({
      where: { productId: id },
      select: { id: true }
   });

   if (recommendation) {
      return { hasRecommendationHistory: true };
   }

   try {
      const product = await prisma.product.delete({
         where: { id }
      });

      return {
         hasRecommendationHistory: false,
         product: serializeProduct(product)
      };
   } catch (error) {
      if (error.code === "P2003") {
         return { hasRecommendationHistory: true };
      }

      throw error;
   }
}

module.exports = {
   getAllProducts,
   getProductById,
   createProduct,
   updateProduct,
   deleteProduct,
   activateProduct,
   permanentlyDeleteProduct
};
