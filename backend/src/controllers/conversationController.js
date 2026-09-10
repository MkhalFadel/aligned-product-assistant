const conversationService = require("../services/conversationService");
const assistantService = require("../services/assistantService");
const { getMessageData } = require("../validators/conversationValidator");

function isAssistantResponseError(error) {
   return typeof error.code === "string"
      && (error.code.startsWith("GEMINI_")
         || error.code.startsWith("SCORING_")
         || error.code === "AI_RECOMMENDATION_ERROR"
         || error.code === "AI_LANGUAGE_ERROR");
}

function getGenerationFailureType(error) {
   const failureTypes = {
      GEMINI_TIMEOUT_ERROR: "timeout",
      GEMINI_NO_CANDIDATE_ERROR: "empty response",
      GEMINI_EMPTY_RESPONSE_ERROR: "empty response",
      GEMINI_MALFORMED_RESPONSE_ERROR: "malformed JSON",
      GEMINI_SCHEMA_ERROR: "schema mismatch",
      GEMINI_BLOCKED_RESPONSE_ERROR: "safety block"
   };

   return error.failureType || failureTypes[error.code] || "provider failure";
}

// Controllers translate conversation service results into HTTP responses.
async function createConversation(req, res, next) {
   try {
      const conversation = await conversationService.createConversation();

      return res.status(201).json({ conversation });
   } catch (error) {
      return next(error);
   }
}

async function getAllConversations(req, res, next) {
   try {
      const conversations = await conversationService.getAllConversations();

      return res.status(200).json({ conversations });
   } catch (error) {
      return next(error);
   }
}

async function getConversationById(req, res, next) {
   try {
      const conversation = await conversationService.getConversationById(req.params.id);

      if (!conversation) {
         return res.status(404).json({ message: "Conversation not found" });
      }

      return res.status(200).json({ conversation });
   } catch (error) {
      return next(error);
   }
}

async function addMessage(req, res, next) {
   try {
      const messageData = getMessageData(req.body);
      // Client user messages are stored once before grounded generation begins.
      const result = await assistantService.addUserMessageAndRespond(req.params.id, messageData);

      if (!result) {
         return res.status(404).json({ message: "Conversation not found" });
      }

      if (result.hasEnded) {
         return res.status(409).json({ message: "Conversation has already ended" });
      }

      if (result.hasReachedMessageLimit) {
         return res.status(429).json({
            message: "This conversation has reached its message limit. Please start a new conversation."
         });
      }

      return res.status(201).json({
         userMessage: result.userMessage,
         assistantMessage: result.assistantMessage
      });
   } catch (error) {
      if (error.code === "GEMINI_CONFIGURATION_ERROR") {
         console.error(error.message);

         return res.status(500).json({
            message: "AI assistant is not configured",
            userMessageStored: true
         });
      }

      if (isAssistantResponseError(error)) {
         const stage = error.code.startsWith("SCORING_") ? "scoring" : "generation";

         console.error("Assistant response failed", {
            stage: stage === "generation" ? "assistant-generation" : stage,
            classification: stage === "generation" ? getGenerationFailureType(error) : error.code,
            name: error.providerName || error.name,
            message: error.providerMessage || error.message,
            providerStatus: error.providerStatus ?? null,
            providerCode: error.providerCode ?? null,
            retryAttempt: error.retryAttempt || 1,
            retryMaximumAttempts: error.retryMaximumAttempts || 1,
            code: error.code
         });

         return res.status(500).json({
            message: "Unable to generate an assistant response right now",
            userMessageStored: true
         });
      }

      return next(error);
   }
}

async function endConversation(req, res, next) {
   try {
      const conversation = await conversationService.endConversation(req.params.id);

      if (!conversation) {
         return res.status(404).json({ message: "Conversation not found" });
      }

      return res.status(200).json({ conversation });
   } catch (error) {
      return next(error);
   }
}

module.exports = {
   createConversation,
   getAllConversations,
   getConversationById,
   addMessage,
   endConversation
};
