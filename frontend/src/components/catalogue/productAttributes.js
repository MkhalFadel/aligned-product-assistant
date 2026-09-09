const categoryLabels = {
   laptops: 'Laptop',
   'desktop PCs': 'Desktop PC',
   monitors: 'Monitor',
   keyboards: 'Keyboard',
   controllers: 'Controller',
}

const categoryOrder = Object.keys(categoryLabels)

const categoryAttributes = {
   laptops: [
      ['processor', 'Processor'],
      ['ram', 'RAM'],
      ['storage', 'Storage'],
      ['gpu', 'GPU'],
      ['weight', 'Weight'],
   ],
   'desktop PCs': [
      ['processor', 'Processor'],
      ['gpu', 'GPU'],
      ['ram', 'RAM'],
      ['storage', 'Storage'],
   ],
   monitors: [
      ['size', 'Size'],
      ['resolution', 'Resolution'],
      ['refreshRate', 'Refresh rate'],
      ['panelType', 'Panel type'],
   ],
   keyboards: [
      ['connectionType', 'Connection'],
      ['switchType', 'Switches'],
      ['layout', 'Layout'],
   ],
   controllers: [
      ['platformCompatibility', 'Compatibility'],
      ['connectionType', 'Connection'],
      ['batteryLife', 'Battery life'],
   ],
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

// Selects a small set of category-specific details so cards stay readable.
export function getProductHighlights(product) {
   const attributes = product.attributes && typeof product.attributes === 'object' ? product.attributes : {}
   const fields = categoryAttributes[product.category] || []

   return fields.reduce((highlights, [key, label]) => {
      const value = attributes[key]

      if (typeof value === 'string' && value.trim()) {
         highlights.push({ label, value: value.trim() })
      }

      return highlights
   }, []).slice(0, 4)
}
