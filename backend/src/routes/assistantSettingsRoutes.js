const express = require("express");
const assistantSettingsController = require("../controllers/assistantSettingsController");
const validate = require("../middleware/validate");
const { validateUpdateAssistantSettings } = require("../validators/assistantSettingsValidator");

const router = express.Router();

router.get("/", assistantSettingsController.getAssistantSettings);
router.put("/", validate(validateUpdateAssistantSettings), assistantSettingsController.updateAssistantSettings);

module.exports = router;
