const prisma = require("../lib/prisma");
const {
   assistantSettingsId,
   getEffectiveAssistantSettings
} = require("../config/assistantSettings");

function serializeAssistantSettings(settings) {
   return {
      assistantName: settings.assistantName,
      systemInstructions: settings.systemInstructions,
      highRiskThreshold: settings.highRiskThreshold
   };
}

async function findCurrentSettings(database = prisma) {
   return database.assistantSettings.findFirst({
      orderBy: { updatedAt: "desc" }
   });
}

// Returns defaults until an owner saves the singleton settings record.
async function getAssistantSettings(database = prisma) {
   const settings = await findCurrentSettings(database);

   return serializeAssistantSettings(getEffectiveAssistantSettings(settings));
}

async function updateAssistantSettings(settingsData) {
   const currentSettings = await findCurrentSettings();
   let settings;

   if (currentSettings) {
      settings = await prisma.assistantSettings.update({
         where: { id: currentSettings.id },
         data: settingsData
      });
   } else {
      try {
         settings = await prisma.assistantSettings.create({
            data: {
               id: assistantSettingsId,
               ...getEffectiveAssistantSettings(settingsData)
            }
         });
      } catch (error) {
         if (error.code !== "P2002") {
            throw error;
         }

         settings = await prisma.assistantSettings.update({
            where: { id: assistantSettingsId },
            data: settingsData
         });
      }
   }

   return serializeAssistantSettings(settings);
}

module.exports = {
   getAssistantSettings,
   updateAssistantSettings
};
