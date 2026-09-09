const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '')

function isRecord(value) {
   return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function createApiError(message, status) {
   const error = new Error(message)
   error.status = status

   return error
}

async function request(path, options) {
   if (!apiUrl) {
      throw new Error('VITE_API_URL is not configured.')
   }

   const response = await fetch(`${apiUrl}${path}`, options)
   let data

   try {
      data = await response.json()
   } catch {
      throw new Error('Report API returned an invalid response.')
   }

   if (!response.ok) {
      throw createApiError(data.message || 'Report request failed', response.status)
   }

   return data
}

function normalizeRecommendedProduct(product) {
   if (!isRecord(product)
      || typeof product.name !== 'string'
      || typeof product.imageUrl !== 'string'
      || typeof product.category !== 'string'
      || typeof product.price !== 'number'
      || !Number.isFinite(product.price)
      || typeof product.reason !== 'string') {
      throw new Error('Report API returned an invalid recommended product.')
   }

   return {
      name: product.name,
      imageUrl: product.imageUrl,
      category: product.category,
      price: product.price,
      reason: product.reason,
   }
}

function normalizeFeedback(feedback) {
   if (feedback === null) {
      return null
   }

   if (!isRecord(feedback)
      || !Number.isInteger(feedback.rating)
      || feedback.rating < 1
      || feedback.rating > 5
      || (feedback.comment !== null && typeof feedback.comment !== 'string')
      || typeof feedback.createdAt !== 'string') {
      throw new Error('Report API returned invalid feedback.')
   }

   return {
      rating: feedback.rating,
      comment: feedback.comment,
      createdAt: feedback.createdAt,
   }
}

// Normalizes the public report shape before it can reach page state.
function normalizeReport(report) {
   if (!isRecord(report)
      || !isRecord(report.conversation)
      || report.conversation.status !== 'ENDED'
      || typeof report.conversation.startedAt !== 'string'
      || (report.conversation.endedAt !== null && typeof report.conversation.endedAt !== 'string')
      || (report.summary !== null && typeof report.summary !== 'string')
      || !Array.isArray(report.recommendedProducts)
      || !report.recommendedProducts.every((product) => isRecord(product))) {
      throw new Error('Report API returned an invalid report.')
   }

   return {
      conversation: {
         status: report.conversation.status,
         startedAt: report.conversation.startedAt,
         endedAt: report.conversation.endedAt,
      },
      summary: report.summary,
      recommendedProducts: report.recommendedProducts.map(normalizeRecommendedProduct),
      feedback: normalizeFeedback(report.feedback),
   }
}

export async function getReport(token) {
   const data = await request(`/api/reports/${encodeURIComponent(token)}`)

   if (!isRecord(data)) {
      throw new Error('Report API returned an invalid report response.')
   }

   return normalizeReport(data.report)
}

export async function submitFeedback(token, feedback) {
   const data = await request(`/api/reports/${encodeURIComponent(token)}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback),
   })

   if (!isRecord(data)) {
      throw new Error('Report API returned an invalid feedback response.')
   }

   return normalizeFeedback(data.feedback)
}
