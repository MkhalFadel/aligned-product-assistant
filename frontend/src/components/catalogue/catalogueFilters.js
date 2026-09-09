function matchesSearch(product, searchTerm) {
   const brand = typeof product.attributes?.brand === 'string' ? product.attributes.brand : ''
   const searchableText = [product.name, product.category, product.description, brand].join(' ').toLowerCase()

   return searchableText.includes(searchTerm.toLowerCase())
}

// Filters active products locally by the selected category and searchable catalogue text.
export function filterProducts(products, searchTerm, selectedCategory) {
   const normalizedSearchTerm = searchTerm.trim()

   return products.filter((product) => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory

      return matchesCategory && matchesSearch(product, normalizedSearchTerm)
   })
}
