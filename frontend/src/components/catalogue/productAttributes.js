const categoryLabels = {
   laptops: 'Laptop',
   'desktop PCs': 'Desktop PC',
   monitors: 'Monitor',
   keyboards: 'Keyboard',
   controllers: 'Controller',
}

const categoryOrder = Object.keys(categoryLabels)

const categorySpecificationFields = {
   laptops: [
      ['brand', 'Brand'],
      ['processor', 'Processor'],
      ['gpu', 'Graphics'],
      ['ram', 'Memory'],
      ['storage', 'Storage'],
      ['display', 'Display'],
      ['refreshRate', 'Refresh rate'],
      ['batteryLife', 'Battery life'],
      ['weight', 'Weight'],
      ['recommendedUse', 'Recommended use'],
   ],
   'desktop PCs': [
      ['brand', 'Brand'],
      ['processor', 'Processor'],
      ['gpu', 'Graphics'],
      ['ram', 'Memory'],
      ['storage', 'Storage'],
      ['powerSupply', 'Power supply'],
      ['recommendedUse', 'Recommended use'],
   ],
   monitors: [
      ['brand', 'Brand'],
      ['size', 'Size'],
      ['resolution', 'Resolution'],
      ['refreshRate', 'Refresh rate'],
      ['panelType', 'Panel type'],
      ['responseTime', 'Response time'],
      ['recommendedUse', 'Recommended use'],
   ],
   keyboards: [
      ['brand', 'Brand'],
      ['connectionType', 'Connection type'],
      ['switchType', 'Switch type'],
      ['layout', 'Layout'],
      ['backlight', 'Backlight'],
      ['recommendedUse', 'Recommended use'],
   ],
   controllers: [
      ['brand', 'Brand'],
      ['platformCompatibility', 'Platform compatibility'],
      ['connectionType', 'Connection type'],
      ['batteryLife', 'Battery life'],
      ['features', 'Features'],
      ['recommendedUse', 'Recommended use'],
   ],
}

const categoryHighlightKeys = {
   laptops: ['processor', 'ram', 'storage', 'gpu'],
   'desktop PCs': ['processor', 'gpu', 'ram', 'storage'],
   monitors: ['size', 'resolution', 'refreshRate', 'panelType'],
   keyboards: ['connectionType', 'switchType', 'layout'],
   controllers: ['platformCompatibility', 'connectionType', 'batteryLife'],
}

function getAttributes(product) {
   return product.attributes && typeof product.attributes === 'object' && !Array.isArray(product.attributes)
      ? product.attributes
      : {}
}

function getSpecificationValue(value) {
   if (Array.isArray(value)) {
      const values = value.filter((item) => typeof item === 'string' && item.trim())

      return values.length > 0 ? values.join(', ') : ''
   }

   if (typeof value === 'string') {
      return value.trim()
   }

   if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value)
   }

   return ''
}

export function getCategoryLabel(category) {
   return categoryLabels[category] || category
}

export function getAvailableCategories(products) {
   const productCategories = new Set(products.map((product) => product.category))
   const orderedCategories = categoryOrder.filter((category) => productCategories.has(category))
   const otherCategories = [...productCategories].filter((category) => !categoryOrder.includes(category)).sort()

   return [...orderedCategories, ...otherCategories]
}

// Converts category-specific product attributes into ordered, readable specifications.
export function getProductSpecifications(product) {
   const attributes = getAttributes(product)
   const fields = categorySpecificationFields[product.category] || []

   return fields.reduce((specifications, [key, label]) => {
      const value = getSpecificationValue(attributes[key])

      if (value) {
         specifications.push({ key, label, value })
      }

      return specifications
   }, [])
}

// Selects a small set of category-specific details so cards stay readable.
export function getProductHighlights(product) {
   const specifications = getProductSpecifications(product)
   const highlights = categoryHighlightKeys[product.category] || []

   return highlights.reduce((selectedSpecifications, key) => {
      const specification = specifications.find((item) => item.key === key)

      if (specification) {
         selectedSpecifications.push(specification)
      }

      return selectedSpecifications
   }, [])
}
