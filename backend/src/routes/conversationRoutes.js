const express = require("express");
const conversationController = require("../controllers/conversationController");
const aiRateLimit = require("../middleware/aiRateLimit");
const validate = require("../middleware/validate");
const {
   validateCreateConversation,
   validateAddMessage
} = require("../validators/conversationValidator");

const router = express.Router();

// Conversation endpoints generate grounded replies for trusted user messages.
router.post("/", validate(validateCreateConversation), conversationController.createConversation);
router.get("/", conversationController.getAllConversations);
router.get("/:id", conversationController.getConversationById);
router.post("/:id/messages", aiRateLimit, validate(validateAddMessage), conversationController.addMessage);
router.post("/:id/end", conversationController.endConversation);

module.exports = router;
