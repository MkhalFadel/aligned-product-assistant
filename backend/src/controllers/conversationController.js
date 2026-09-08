const conversationService = require("../services/conversationService");
const assistantService = require("../services/assistantService");
const { getMessageData } = require("../validators/conversationValidator");

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

      return res.status(201).json({
         userMessage: result.userMessage,
         assistantMessage: result.assistantMessage
      });
   } catch (error) {
      if (error.code === "GEMINI_CONFIGURATION_ERROR") {
         console.error(error.message);

         return res.status(500).json({ message: "AI assistant is not configured" });
      }

      if (error.code === "GEMINI_PROVIDER_ERROR"
         || error.code === "GEMINI_RESPONSE_ERROR"
         || error.code === "AI_RECOMMENDATION_ERROR"
         || error.code === "AI_LANGUAGE_ERROR") {
         console.error("Assistant response failed", { code: error.code });

         return res.status(500).json({ message: "Unable to generate an assistant response right now" });
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
