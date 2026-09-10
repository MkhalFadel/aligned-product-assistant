const prisma = require("../lib/prisma");
const { getFallbackSummary } = require("./conversationService");

function serializeNumber(value) {
   if (value === null || value === undefined) {
      return value;
   }

   return Number(value);
}

function getRecommendedProducts(messages) {
   const productIds = new Set();
   const recommendedProducts = [];

   messages.forEach((message) => {
      message.recommendations.forEach((recommendation) => {
         const { product } = recommendation;

         if (!product || productIds.has(product.id)) {
            return;
         }

         productIds.add(product.id);
         recommendedProducts.push({
            id: product.id,
            name: product.name,
            imageUrl: product.imageUrl,
            category: product.category,
            price: serializeNumber(product.price),
            isAvailable: product.isActive,
            reason: recommendation.reason
         });
      });
   });

   return recommendedProducts;
}

function serializeFeedback(feedback) {
   if (!feedback) {
      return null;
   }

   return {
      rating: feedback.rating,
      comment: feedback.comment,
      createdAt: feedback.createdAt
   };
}

function serializeReport(conversation) {
   return {
      conversation: {
         status: conversation.status,
         startedAt: conversation.startedAt,
         endedAt: conversation.endedAt
      },
      summary: conversation.summary || getFallbackSummary(
         conversation.messages,
         conversation.detectedLanguage
      ),
      recommendedProducts: getRecommendedProducts(conversation.messages),
      feedback: serializeFeedback(conversation.feedback)
   };
}

async function findConversationByToken(token) {
   return prisma.conversation.findUnique({
      where: { reportToken: token },
      include: {
         messages: {
            orderBy: { createdAt: "asc" },
            select: {
               role: true,
               content: true,
               recommendations: {
                  select: {
                     reason: true,
                     product: {
                        select: {
                           id: true,
                           name: true,
                           imageUrl: true,
                           category: true,
                           price: true,
                           isActive: true
                        }
                     }
                  }
               }
            }
         },
         feedback: true
      }
   });
}

// Looks up a report through its unguessable public token, never a conversation ID.
async function getReportByToken(token) {
   const conversation = await findConversationByToken(token);

   if (!conversation) {
      return null;
   }

   if (conversation.status !== "ENDED") {
      return { hasEnded: false };
   }

   return {
      hasEnded: true,
      report: serializeReport(conversation)
   };
}

// Upserts feedback so customers can revise their rating without creating duplicates.
async function submitFeedback(token, feedbackData) {
   const conversation = await prisma.conversation.findUnique({
      where: { reportToken: token },
      select: {
         id: true,
         status: true
      }
   });

   if (!conversation) {
      return null;
   }

   if (conversation.status !== "ENDED") {
      return { hasEnded: false };
   }

   const feedback = await prisma.feedback.upsert({
      where: { conversationId: conversation.id },
      create: {
         conversationId: conversation.id,
         rating: feedbackData.rating,
         comment: feedbackData.comment
      },
      update: {
         rating: feedbackData.rating,
         comment: feedbackData.comment
      }
   });

   return {
      hasEnded: true,
      feedback: serializeFeedback(feedback)
   };
}

module.exports = {
   getReportByToken,
   submitFeedback
};
