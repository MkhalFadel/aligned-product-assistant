const assistantSettingsService = require("../services/assistantSettingsService");
const { getAssistantSettingsData } = require("../validators/assistantSettingsValidator");

async function getAssistantSettings(req, res, next) {
   try {
      const settings = await assistantSettingsService.getAssistantSettings();

      return res.status(200).json({ settings });
   } catch (error) {
      return next(error);
   }
}

async function updateAssistantSettings(req, res, next) {
   try {
      const settingsData = getAssistantSettingsData(req.body);
      const settings = await assistantSettingsService.updateAssistantSettings(settingsData);

      return res.status(200).json({ settings });
   } catch (error) {
      return next(error);
   }
}

module.exports = {
   getAssistantSettings,
   updateAssistantSettings
};
