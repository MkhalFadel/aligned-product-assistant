// Maps each catalogue category to the attributes the backend stores for it.
export const categoryOptions = [
   {
      value: 'laptops',
      label: 'Laptop',
      fields: [
         { name: 'brand', label: 'Brand' },
         { name: 'processor', label: 'Processor' },
         { name: 'gpu', label: 'GPU' },
         { name: 'ram', label: 'RAM' },
         { name: 'storage', label: 'Storage' },
         { name: 'display', label: 'Display' },
         { name: 'refreshRate', label: 'Refresh rate' },
         { name: 'batteryLife', label: 'Battery life' },
         { name: 'weight', label: 'Weight' },
         { name: 'recommendedUse', label: 'Recommended use' },
      ],
   },
   {
      value: 'desktop PCs',
      label: 'Desktop PC',
      fields: [
         { name: 'brand', label: 'Brand' },
         { name: 'processor', label: 'Processor' },
         { name: 'gpu', label: 'GPU' },
         { name: 'ram', label: 'RAM' },
         { name: 'storage', label: 'Storage' },
         { name: 'powerSupply', label: 'Power supply' },
         { name: 'recommendedUse', label: 'Recommended use' },
      ],
   },
   {
      value: 'monitors',
      label: 'Monitor',
      fields: [
         { name: 'brand', label: 'Brand' },
         { name: 'size', label: 'Size' },
         { name: 'resolution', label: 'Resolution' },
         { name: 'refreshRate', label: 'Refresh rate' },
         { name: 'panelType', label: 'Panel type' },
         { name: 'responseTime', label: 'Response time' },
      ],
   },
   {
      value: 'keyboards',
      label: 'Keyboard',
      fields: [
         { name: 'brand', label: 'Brand' },
         { name: 'connectionType', label: 'Connection type' },
         { name: 'switchType', label: 'Switch type' },
         { name: 'layout', label: 'Layout' },
         { name: 'backlight', label: 'Backlight' },
      ],
   },
   {
      value: 'controllers',
      label: 'Controller',
      fields: [
         { name: 'brand', label: 'Brand' },
         { name: 'platformCompatibility', label: 'Platform compatibility' },
         { name: 'connectionType', label: 'Connection type' },
         { name: 'batteryLife', label: 'Battery life' },
         { name: 'features', label: 'Features', type: 'list' },
      ],
   },
]

export function getCategoryFields(category) {
   const selectedCategory = categoryOptions.find((option) => option.value === category)

   return selectedCategory ? selectedCategory.fields : []
}
