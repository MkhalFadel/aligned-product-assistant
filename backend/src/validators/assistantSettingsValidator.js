const allowedSettingsFields = [
   "assistantName",
   "systemInstructions",
   "highRiskThreshold"
];
const maxAssistantNameLength = 80;
const maxSystemInstructionsLength = 2000;

function isPlainObject(value) {
   if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return false;
   }

   const prototype = Object.getPrototypeOf(value);

   return prototype === Object.prototype || prototype === null;
}

function hasOwnProperty(object, property) {
   return Object.prototype.hasOwnProperty.call(object, property);
}

function validateStringField(settings, field, maxLength, errors) {
   if (!hasOwnProperty(settings, field)) {
      return;
   }

   if (typeof settings[field] !== "string" || settings[field].trim() === "") {
      errors.push(`${field} must be a non-empty string`);
   } else if (settings[field].trim().length > maxLength) {
      errors.push(`${field} must be ${maxLength} characters or fewer`);
   }
}

function validateUpdateAssistantSettings(settings) {
   const errors = [];

   if (!isPlainObject(settings)) {
      return ["request body must be a plain object"];
   }

   if (Object.keys(settings).length === 0) {
      errors.push("request body cannot be empty");
   }

   Object.keys(settings).forEach((field) => {
      if (!allowedSettingsFields.includes(field)) {
         errors.push(`${field} is not allowed`);
      }
   });

   validateStringField(settings, "assistantName", maxAssistantNameLength, errors);
   validateStringField(settings, "systemInstructions", maxSystemInstructionsLength, errors);

   if (hasOwnProperty(settings, "highRiskThreshold")
      && (typeof settings.highRiskThreshold !== "number"
         || !Number.isFinite(settings.highRiskThreshold)
         || settings.highRiskThreshold < 0
         || settings.highRiskThreshold > 100)) {
      errors.push("highRiskThreshold must be a number from 0 to 100");
   }

   return errors;
}

function getAssistantSettingsData(settings) {
   const settingsData = {};

   allowedSettingsFields.forEach((field) => {
      if (!hasOwnProperty(settings, field)) {
         return;
      }

      settingsData[field] = typeof settings[field] === "string"
         ? settings[field].trim()
         : settings[field];
   });

   return settingsData;
}

module.exports = {
   validateUpdateAssistantSettings,
   getAssistantSettingsData
};
