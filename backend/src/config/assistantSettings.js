const assistantSettingsId = "default";

const defaultAssistantSettings = Object.freeze({
   assistantName: "Aligned Product Assistant",
   systemInstructions: "Be helpful, concise, and practical when recommending products.",
   highRiskThreshold: 30
});

function getEffectiveAssistantSettings(settings) {
   return {
      ...defaultAssistantSettings,
      ...settings
   };
}

module.exports = {
   assistantSettingsId,
   defaultAssistantSettings,
   getEffectiveAssistantSettings
};
