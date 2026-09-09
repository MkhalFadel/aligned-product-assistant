const { randomUUID } = require("crypto");
const prisma = require("../lib/prisma");

function serializeNumber(value) {
   if (value === null || value === undefined) {
      return value;
   }

   return Number(value);
}

function serializeProduct(product) {
   if (!product) {
      return null;
   }

   return {
      ...product,
      price: serializeNumber(product.price)
   };
}

// Converts nullable score values and nested recommended products for API responses.
function serializeMessage(message) {
   const serializedMessage = {
      ...message,
      accuracyScore: serializeNumber(message.accuracyScore),
      hallucinationRisk: serializeNumber(message.hallucinationRisk)
   };

   if (message.recommendations) {
      serializedMessage.recommendations = message.recommendations.map((recommendation) => ({
         ...recommendation,
         product: serializeProduct(recommendation.product)
      }));
   }

   return serializedMessage;
}

function getConversationSummary(messages) {
   // Only fully scored assistant messages contribute to conversation-level averages.
   const scoredAssistantMessages = messages.filter((message) => (
      message.role === "ASSISTANT"
      && Number.isFinite(message.accuracyScore)
      && Number.isFinite(message.hallucinationRisk)
   ));
   const flaggedMessageCount = messages.filter((message) => (
      message.role === "ASSISTANT" && message.isFlagged
   )).length;

   if (scoredAssistantMessages.length === 0) {
      return {
         averageAccuracy: null,
         averageHallucinationRisk: null,
         flaggedMessageCount
      };
   }

   const totalAccuracy = scoredAssistantMessages.reduce((total, message) => (
      total + message.accuracyScore
   ), 0);
   const totalHallucinationRisk = scoredAssistantMessages.reduce((total, message) => (
      total + message.hallucinationRisk
   ), 0);

   return {
      averageAccuracy: totalAccuracy / scoredAssistantMessages.length,
      averageHallucinationRisk: totalHallucinationRisk / scoredAssistantMessages.length,
      flaggedMessageCount
   };
}

function serializeConversation(conversation, { includeMessages = false } = {}) {
   if (!conversation) {
      return null;
   }

   const { _count, messages, ...conversationData } = conversation;
   const serializedConversation = { ...conversationData };

   if (_count) {
      serializedConversation.messageCount = _count.messages;
   }

   if (messages) {
      if (serializedConversation.messageCount === undefined) {
         serializedConversation.messageCount = messages.length;
      }

      Object.assign(serializedConversation, getConversationSummary(messages));
   }

   if (includeMessages && messages) {
      serializedConversation.messages = messages.map(serializeMessage);
   }

   return serializedConversation;
}

async function createConversation() {
   // Store tokens once so the later report URL remains stable after ending.
   const conversation = await prisma.conversation.create({
      data: {
         sessionId: randomUUID(),
         reportToken: randomUUID(),
         status: "ACTIVE",
         detectedLanguage: null
      }
   });

   return serializeConversation(conversation);
}

async function getAllConversations() {
   const conversations = await prisma.conversation.findMany({
      select: {
         id: true,
         status: true,
         detectedLanguage: true,
         startedAt: true,
         endedAt: true,
         createdAt: true,
         _count: {
            select: { messages: true }
         },
         messages: {
            select: {
               role: true,
               accuracyScore: true,
               hallucinationRisk: true,
               isFlagged: true
            }
         }
      },
      orderBy: { createdAt: "desc" }
   });

   return conversations.map(serializeConversation);
}

async function getConversationById(id) {
   const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
         messages: {
            orderBy: { createdAt: "asc" },
            include: {
               // Historical recommendations retain their product even when it is inactive.
               recommendations: {
                  include: { product: true }
               }
            }
         }
      }
   });

   return serializeConversation(conversation, { includeMessages: true });
}

async function addMessage(id, messageData) {
   const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { status: true }
   });

   if (!conversation) {
      return null;
   }

   if (conversation.status === "ENDED") {
      return { hasEnded: true };
   }

   const message = await prisma.message.create({
      data: {
         conversationId: id,
         role: messageData.role,
         content: messageData.content,
         language: messageData.language
      }
   });

   if (messageData.role === "USER") {
      // The first user language wins; later messages cannot overwrite it.
      await prisma.conversation.updateMany({
         where: {
            id,
            detectedLanguage: null
         },
         data: { detectedLanguage: messageData.language }
      });
   }

   return {
      hasEnded: false,
      message: serializeMessage(message)
   };
}

async function endConversation(id) {
   const conversation = await prisma.conversation.findUnique({
      where: { id }
   });

   if (!conversation) {
      return null;
   }

   if (conversation.status === "ENDED") {
      return serializeConversation(conversation);
   }

   // Ending updates only the lifecycle fields and preserves the original report token.
   const endedConversation = await prisma.conversation.update({
      where: { id },
      data: {
         status: "ENDED",
         endedAt: new Date()
      }
   });

   return serializeConversation(endedConversation);
}

module.exports = {
   createConversation,
   getAllConversations,
   getConversationById,
   addMessage,
   endConversation,
   serializeMessage
};
