const prisma = require("../lib/prisma");
const aiService = require("./aiService");
const scoringService = require("./scoringService");
const { buildCatalogueContext } = require("./catalogueContextService");
const { serializeMessage, updateDetectedLanguage } = require("./conversationService");
const { maxMessagesPerConversation } = require("../config/limits");

function createAssistantError(message, code) {
   const error = new Error(message);
   error.code = code;

   return error;
}

function validateRecommendations(recommendedProducts, activeProducts) {
   const activeProductIds = new Set(activeProducts.map((product) => product.id));
   const usedProductIds = new Set();

   return recommendedProducts.reduce((recommendations, recommendation) => {
      if (!activeProductIds.has(recommendation.productId)) {
         throw createAssistantError("AI response contained an inactive or unknown product", "AI_RECOMMENDATION_ERROR");
      }

      if (usedProductIds.has(recommendation.productId)) {
         return recommendations;
      }

      usedProductIds.add(recommendation.productId);
      recommendations.push(recommendation);

      return recommendations;
   }, []);
}

async function storeAssistantMessage(conversationId, response, recommendations, scores) {
   // The nested recommendation write and assistant message commit together.
   const messageData = {
      conversationId,
      role: "ASSISTANT",
      content: response.answer,
      language: response.language,
      accuracyScore: scores.accuracyScore,
      hallucinationRisk: scores.hallucinationRisk,
      isFlagged: scores.isFlagged
   };

   if (recommendations.length > 0) {
      messageData.recommendations = {
         create: recommendations.map((recommendation) => ({
            productId: recommendation.productId,
            reason: recommendation.reason
         }))
      };
   }

   const [message] = await prisma.$transaction([
      prisma.message.create({
         data: messageData,
         include: {
            recommendations: {
               include: { product: true }
            }
         }
      })
   ]);

   return serializeMessage(message);
}

// Stores one trusted user message, then generates and persists its grounded reply.
async function addUserMessageAndRespond(id, messageData) {
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

   const userMessageCount = await prisma.message.count({
      where: {
         conversationId: id,
         role: "USER"
      }
   });

   // The cap is checked before storing a USER message or calling the provider.
   if (userMessageCount >= maxMessagesPerConversation) {
      return { hasReachedMessageLimit: true };
   }

   const userMessage = await prisma.$transaction(async (transaction) => {
      const message = await transaction.message.create({
         data: {
            conversationId: id,
            role: "USER",
            content: messageData.content,
            language: messageData.language
         }
      });

      await updateDetectedLanguage(id, messageData.language, transaction);

      return message;
   });

   const [history, activeProducts, assistantSettings] = await Promise.all([
      prisma.message.findMany({
         where: { conversationId: id },
         orderBy: { createdAt: "desc" },
         take: 12
      }),
      prisma.product.findMany({
         where: { isActive: true },
         orderBy: { createdAt: "desc" }
      }),
      prisma.assistantSettings.findFirst({
         select: { highRiskThreshold: true },
         orderBy: { updatedAt: "desc" }
      })
   ]);
   const catalogue = buildCatalogueContext(activeProducts);

   const response = await aiService.generateAssistantResponse({
      language: messageData.language,
      history: history.reverse(),
      catalogue
   });

   if (response.language !== messageData.language) {
      throw createAssistantError("AI response language did not match the user message", "AI_LANGUAGE_ERROR");
   }

   const recommendations = validateRecommendations(response.recommendedProducts, activeProducts);
   const scores = await scoringService.scoreAssistantResponse({
      customerMessage: messageData.content,
      assistantAnswer: response.answer,
      recommendations,
      activeProducts: catalogue,
      highRiskThreshold: assistantSettings?.highRiskThreshold
   });
   // TODO: Production should hold high-risk replies, retry with stricter grounding, re-score, then escalate if needed.
   const assistantMessage = await storeAssistantMessage(id, response, recommendations, scores);

   return {
      hasEnded: false,
      userMessage: serializeMessage(userMessage),
      assistantMessage
   };
}

module.exports = {
   addUserMessageAndRespond
};
