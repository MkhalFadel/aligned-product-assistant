const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '')

function isPlainObject(value) {
   return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function createApiError(message, status) {
   const error = new Error(message)
   error.status = status

   return error
}

// Keeps product API requests in one place for the dashboard.
async function request(path, options) {
   if (!apiUrl) {
      throw new Error('VITE_API_URL is not configured.')
   }

   const response = await fetch(`${apiUrl}${path}`, options)
   let data

   try {
      data = await response.json()
   } catch {
      throw new Error('Product API returned an invalid response.')
   }

   if (!response.ok) {
      throw createApiError(data.message || 'Product request failed', response.status)
   }

   return data
}

function getResponseProduct(data) {
   if (!data.product || typeof data.product !== 'object' || Array.isArray(data.product)) {
      throw new Error('Product API returned an invalid product.')
   }

   return data.product
}

function normalizePublicProduct(product) {
   if (typeof product.id !== 'string'
      || typeof product.name !== 'string'
      || typeof product.description !== 'string'
      || typeof product.price !== 'number'
      || !Number.isFinite(product.price)
      || typeof product.imageUrl !== 'string'
      || typeof product.category !== 'string'
      || !isPlainObject(product.attributes)
      || product.isActive !== true) {
      throw new Error('Product API returned an invalid public product.')
   }

   return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      category: product.category,
      attributes: product.attributes,
   }
}

async function getProductList(path) {
   const data = await request(path)

   if (!Array.isArray(data.products)) {
      throw new Error('Product API returned an invalid product list.')
   }

   return data.products
}

export function getProducts() {
   return getProductList('/api/products?includeInactive=true')
}

export function getActiveProducts() {
   return getProductList('/api/products')
}

export async function getProductById(id) {
   const data = await request(`/api/products/${encodeURIComponent(id)}?activeOnly=true`)

   return normalizePublicProduct(getResponseProduct(data))
}

export async function createProduct(productData) {
   const data = await request('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
   })

   return getResponseProduct(data)
}

export async function updateProduct(id, productData) {
   const data = await request(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
   })

   return getResponseProduct(data)
}

export async function deleteProduct(id) {
   const data = await request(`/api/products/${id}`, {
      method: 'DELETE',
   })

   return getResponseProduct(data)
}

export async function activateProduct(id) {
   const data = await request(`/api/products/${id}/activate`, {
      method: 'PATCH',
   })

   return getResponseProduct(data)
}

export async function permanentlyDeleteProduct(id) {
   const data = await request(`/api/products/${id}/permanent`, {
      method: 'DELETE',
   })

   return getResponseProduct(data)
}
