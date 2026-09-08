const conversationService = require("../services/conversationService");
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
      const result = await conversationService.addMessage(req.params.id, messageData);

      if (!result) {
         return res.status(404).json({ message: "Conversation not found" });
      }

      if (result.hasEnded) {
         return res.status(409).json({ message: "Conversation has already ended" });
      }

      return res.status(201).json({ message: result.message });
   } catch (error) {
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
