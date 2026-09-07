const productService = require("../services/productService");
const { getProductData } = require("../validators/productValidator");

// Controllers translate product service results into HTTP responses.
async function getAllProducts(req, res, next) {
   try {
      // Only the exact query value includes inactive products.
      const includeInactive = req.query.includeInactive === "true";
      const products = await productService.getAllProducts(includeInactive);

      return res.status(200).json({ products });
   } catch (error) {
      return next(error);
   }
}

async function getProductById(req, res, next) {
   try {
      const product = await productService.getProductById(req.params.id);

      if (!product) {
         return res.status(404).json({ message: "Product not found" });
      }

      return res.status(200).json({ product });
   } catch (error) {
      return next(error);
   }
}

async function createProduct(req, res, next) {
   try {
      // Build a safe Prisma payload from validated request data.
      const productData = getProductData(req.body, true);
      const product = await productService.createProduct(productData);

      return res.status(201).json({ product });
   } catch (error) {
      return next(error);
   }
}

async function updateProduct(req, res, next) {
   try {
      // Build a safe Prisma payload from validated request data.
      const productData = getProductData(req.body);
      const product = await productService.updateProduct(req.params.id, productData);

      if (!product) {
         return res.status(404).json({ message: "Product not found" });
      }

      return res.status(200).json({ product });
   } catch (error) {
      return next(error);
   }
}

async function deleteProduct(req, res, next) {
   try {
      const product = await productService.deleteProduct(req.params.id);

      if (!product) {
         return res.status(404).json({ message: "Product not found" });
      }

      return res.status(200).json({ product });
   } catch (error) {
      return next(error);
   }
}

async function activateProduct(req, res, next) {
   try {
      const product = await productService.activateProduct(req.params.id);

      if (!product) {
         return res.status(404).json({ message: "Product not found" });
      }

      return res.status(200).json({ product });
   } catch (error) {
      return next(error);
   }
}

async function permanentlyDeleteProduct(req, res, next) {
   try {
      const result = await productService.permanentlyDeleteProduct(req.params.id);

      if (!result) {
         return res.status(404).json({ message: "Product not found" });
      }

      if (result.hasRecommendationHistory) {
         return res.status(409).json({
            message: "Product cannot be permanently deleted because it has recommendation history. Deactivate it instead."
         });
      }

      return res.status(200).json({ product: result.product });
   } catch (error) {
      return next(error);
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
