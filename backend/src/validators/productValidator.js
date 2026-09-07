const allowedProductFields = [
   "name",
   "description",
   "price",
   "imageUrl",
   "category",
   "attributes",
   "isActive"
];

// Accept JSON-style objects while excluding arrays and other object types.
function isPlainObject(value) {
   if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return false;
   }

   const prototype = Object.getPrototypeOf(value);

   return prototype === Object.prototype || prototype === null;
}

function hasOwnProperty(object, property) {
   return Object.prototype.hasOwnProperty.call(object, property);
}

function validateStringField(product, field, errors, required) {
   if (!hasOwnProperty(product, field)) {
      if (required) {
         errors.push(`${field} is required`);
      }

      return;
   }

   if (typeof product[field] !== "string" || product[field].trim() === "") {
      errors.push(`${field} must be a non-empty string`);
   }
}

function validateProductFields(product, errors, required) {
   validateStringField(product, "name", errors, required);
   validateStringField(product, "description", errors, required);
   validateStringField(product, "category", errors, required);

   if (!hasOwnProperty(product, "price")) {
      if (required) {
         errors.push("price is required");
      }
   } else if (typeof product.price !== "number" || !Number.isFinite(product.price) || product.price <= 0) {
      errors.push("price must be a positive number");
   }

   if (!hasOwnProperty(product, "attributes")) {
      if (required) {
         errors.push("attributes is required");
      }
   } else if (!isPlainObject(product.attributes)) {
      errors.push("attributes must be a plain object");
   }

   if (hasOwnProperty(product, "imageUrl")) {
      if (typeof product.imageUrl !== "string") {
         errors.push("imageUrl must be a string");
      } else if (product.imageUrl.trim() === "") {
         errors.push("imageUrl must be a non-empty string");
      }
   }

   if (hasOwnProperty(product, "isActive") && typeof product.isActive !== "boolean") {
      errors.push("isActive must be a boolean");
   }
}

function validateUnknownFields(product, errors) {
   Object.keys(product).forEach((field) => {
      if (!allowedProductFields.includes(field)) {
         errors.push(`${field} is not allowed`);
      }
   });
}

function validateCreateProduct(product) {
   const errors = [];

   if (!isPlainObject(product)) {
      return ["request body must be a plain object"];
   }

   validateUnknownFields(product, errors);
   validateProductFields(product, errors, true);

   return errors;
}

function validateUpdateProduct(product) {
   const errors = [];

   if (!isPlainObject(product)) {
      return ["request body must be a plain object"];
   }

   if (Object.keys(product).length === 0) {
      errors.push("request body cannot be empty");
   }

   validateUnknownFields(product, errors);
   validateProductFields(product, errors, false);

   return errors;
}

function getProductData(product, usePlaceholderImage) {
   // Copy only fields that are safe to send to Prisma.
   const productData = {};

   allowedProductFields.forEach((field) => {
      if (hasOwnProperty(product, field)) {
         productData[field] = product[field];
      }
   });

   if (usePlaceholderImage && !hasOwnProperty(productData, "imageUrl")) {
      productData.imageUrl = "https://placehold.co/1200x900/png?text=Product";
   }

   return productData;
}

module.exports = {
   validateCreateProduct,
   validateUpdateProduct,
   getProductData
};
