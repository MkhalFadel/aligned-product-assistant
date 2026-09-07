const express = require("express");
const productController = require("../controllers/productController");
const validate = require("../middleware/validate");
const { validateCreateProduct, validateUpdateProduct } = require("../validators/productValidator");

const router = express.Router();

// Product catalogue CRUD endpoints.
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.post("/", validate(validateCreateProduct), productController.createProduct);
router.put("/:id", validate(validateUpdateProduct), productController.updateProduct);
router.patch("/:id/activate", productController.activateProduct);
router.delete("/:id/permanent", productController.permanentlyDeleteProduct);
router.delete("/:id", productController.deleteProduct);

module.exports = router;
