const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '')

function isRecord(value) {
   return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNullableNumber(value) {
   return value === null || (typeof value === 'number' && Number.isFinite(value))
}

async function request(path) {
   if (!apiUrl) {
      throw new Error('VITE_API_URL is not configured.')
   }

   const response = await fetch(`${apiUrl}${path}`)
   let data

   try {
      data = await response.json()
   } catch {
      throw new Error('Conversation API returned an invalid response.')
   }

   if (!response.ok) {
      throw new Error(data.message || 'Conversation request failed')
   }

   return data
}

function isConversationSummary(conversation) {
   return isRecord(conversation)
      && typeof conversation.id === 'string'
      && conversation.id.trim() !== ''
      && typeof conversation.status === 'string'
      && (conversation.detectedLanguage === null || typeof conversation.detectedLanguage === 'string')
      && typeof conversation.startedAt === 'string'
      && (conversation.endedAt === null || typeof conversation.endedAt === 'string')
      && Number.isInteger(conversation.messageCount)
      && conversation.messageCount >= 0
      && isNullableNumber(conversation.averageAccuracy)
      && isNullableNumber(conversation.averageHallucinationRisk)
      && Number.isInteger(conversation.flaggedMessageCount)
      && conversation.flaggedMessageCount >= 0
}

function isRecommendation(recommendation) {
   return isRecord(recommendation)
      && typeof recommendation.id === 'string'
      && typeof recommendation.productId === 'string'
      && typeof recommendation.reason === 'string'
      && (recommendation.product === null || isRecord(recommendation.product))
}

function isFeedback(feedback) {
   return feedback === null || (
      isRecord(feedback)
      && Number.isInteger(feedback.rating)
      && feedback.rating >= 1
      && feedback.rating <= 5
      && (feedback.comment === null || typeof feedback.comment === 'string')
      && typeof feedback.createdAt === 'string'
   )
}

function isConversationMessage(message) {
   return isRecord(message)
      && typeof message.id === 'string'
      && (message.role === 'USER' || message.role === 'ASSISTANT')
      && typeof message.content === 'string'
      && typeof message.language === 'string'
      && typeof message.createdAt === 'string'
      && isNullableNumber(message.accuracyScore)
      && isNullableNumber(message.hallucinationRisk)
      && typeof message.isFlagged === 'boolean'
      && (message.scoringMode === 'FULL' || message.scoringMode === 'DETERMINISTIC_FALLBACK')
      && Array.isArray(message.recommendations)
      && message.recommendations.every(isRecommendation)
}

function getConversation(data, errorMessage) {
   if (!isRecord(data) || !isConversationSummary(data.conversation)) {
      throw new Error(errorMessage)
   }

   return data.conversation
}

export async function getConversations() {
   const data = await request('/api/conversations')

   if (!isRecord(data) || !Array.isArray(data.conversations) || !data.conversations.every(isConversationSummary)) {
      throw new Error('Conversation API returned an invalid conversation list.')
   }

   return data.conversations
}

export async function getConversationById(id) {
   const data = await request(`/api/conversations/${id}`)
   const conversation = getConversation(data, 'Conversation API returned an invalid conversation.')

   if (!Array.isArray(conversation.messages)
      || !conversation.messages.every(isConversationMessage)
      || (conversation.summary !== null && typeof conversation.summary !== 'string')
      || !isFeedback(conversation.feedback)) {
      throw new Error('Conversation API returned an invalid message history.')
   }

   return conversation
}
