const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '')

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
      throw new Error(data.message || 'Product request failed')
   }

   return data
}

function getResponseProduct(data) {
   if (!data.product || typeof data.product !== 'object' || Array.isArray(data.product)) {
      throw new Error('Product API returned an invalid product.')
   }

   return data.product
}

export async function getProducts() {
   const data = await request('/api/products?includeInactive=true')

   if (!Array.isArray(data.products)) {
      throw new Error('Product API returned an invalid product list.')
   }

   return data.products
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
