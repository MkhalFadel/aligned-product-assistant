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
      throw new Error('Chat API returned an invalid response.')
   }

   if (!response.ok) {
      throw createApiError(data.message || 'Chat request failed', response.status)
   }

   return data
}

function normalizeProduct(product) {
   if (!isRecord(product)
      || typeof product.id !== 'string'
      || typeof product.name !== 'string'
      || typeof product.price !== 'number'
      || !Number.isFinite(product.price)
      || typeof product.category !== 'string'
      || typeof product.imageUrl !== 'string') {
      throw new Error('Chat API returned an invalid recommended product.')
   }

   return {
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      imageUrl: product.imageUrl,
   }
}

function normalizeRecommendations(recommendations) {
   if (recommendations === undefined) {
      return []
   }

   if (!Array.isArray(recommendations)) {
      throw new Error('Chat API returned invalid recommendations.')
   }

   return recommendations.map((recommendation) => {
      if (!isRecord(recommendation)
         || typeof recommendation.id !== 'string'
         || typeof recommendation.reason !== 'string') {
         throw new Error('Chat API returned an invalid recommendation.')
      }

      return {
         id: recommendation.id,
         reason: recommendation.reason,
         product: normalizeProduct(recommendation.product),
      }
   })
}

// Keeps only the fields needed by the customer chat from conversation responses.
function normalizeMessage(message) {
   if (!isRecord(message)
      || typeof message.id !== 'string'
      || (message.role !== 'USER' && message.role !== 'ASSISTANT')
      || typeof message.content !== 'string'
      || typeof message.language !== 'string'
      || typeof message.createdAt !== 'string') {
      throw new Error('Chat API returned an invalid message.')
   }

   return {
      id: message.id,
      role: message.role,
      content: message.content,
      recommendations: normalizeRecommendations(message.recommendations),
   }
}

function normalizeConversation(conversation) {
   if (!isRecord(conversation)
      || typeof conversation.id !== 'string'
      || typeof conversation.status !== 'string'
      || typeof conversation.reportToken !== 'string') {
      throw new Error('Chat API returned an invalid conversation.')
   }

   return {
      id: conversation.id,
      status: conversation.status,
      reportToken: conversation.reportToken,
   }
}

export async function createConversation() {
   const data = await request('/api/conversations', { method: 'POST' })

   if (!isRecord(data)) {
      throw new Error('Chat API returned an invalid conversation response.')
   }

   return normalizeConversation(data.conversation)
}

export async function sendMessage(conversationId, message) {
   const data = await request(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
   })

   if (!isRecord(data)) {
      throw new Error('Chat API returned an invalid message response.')
   }

   return {
      userMessage: normalizeMessage(data.userMessage),
      assistantMessage: normalizeMessage(data.assistantMessage),
   }
}

export async function endConversation(conversationId) {
   const data = await request(`/api/conversations/${conversationId}/end`, { method: 'POST' })

   if (!isRecord(data)) {
      throw new Error('Chat API returned an invalid end conversation response.')
   }

   return normalizeConversation(data.conversation)
}
