const express = require("express");
const conversationController = require("../controllers/conversationController");
const validate = require("../middleware/validate");
const {
   validateCreateConversation,
   validateAddMessage
} = require("../validators/conversationValidator");

const router = express.Router();

// Conversation persistence endpoints without AI generation or scoring.
router.post("/", validate(validateCreateConversation), conversationController.createConversation);
router.get("/", conversationController.getAllConversations);
router.get("/:id", conversationController.getConversationById);
router.post("/:id/messages", validate(validateAddMessage), conversationController.addMessage);
router.post("/:id/end", conversationController.endConversation);

module.exports = router;
