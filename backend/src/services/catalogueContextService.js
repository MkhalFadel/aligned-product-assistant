// Builds the compact active-catalogue payload used to ground model responses.
function buildCatalogueContext(products) {
   return products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      category: product.category,
      attributes: product.attributes
   }));
}

module.exports = {
   buildCatalogueContext
};
