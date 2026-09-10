const allowedMessageFields = ["role", "content", "language"];
const allowedRoles = ["USER"];
const allowedLanguages = ["ENGLISH", "ARABIZI", "ARABIC", "MIXED"];
const { maxMessageLength } = require("../config/limits");

function isPlainObject(value) {
   if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return false;
   }

   const prototype = Object.getPrototypeOf(value);

   return prototype === Object.prototype || prototype === null;
}

function validateUnknownFields(message, errors) {
   Object.keys(message).forEach((field) => {
      if (!allowedMessageFields.includes(field)) {
         errors.push(`${field} is not allowed`);
      }
   });
}

// Keeps the no-body conversation creation contract explicit.
function validateCreateConversation(body) {
   if (body === undefined) {
      return [];
   }

   if (!isPlainObject(body)) {
      return ["request body must be a plain object"];
   }

   if (Object.keys(body).length > 0) {
      return ["request body is not allowed"];
   }

   return [];
}

function validateAddMessage(message) {
   const errors = [];

   if (!isPlainObject(message)) {
      return ["request body must be a plain object"];
   }

   validateUnknownFields(message, errors);

   if (typeof message.content !== "string" || message.content.trim() === "") {
      errors.push("content must be a non-empty string");
   } else if (message.content.length > maxMessageLength) {
      errors.push(`Message must be ${maxMessageLength} characters or fewer.`);
   }

   if (!allowedRoles.includes(message.role)) {
      errors.push("role must be USER");
   }

   if (!allowedLanguages.includes(message.language)) {
      errors.push("language must be ENGLISH, ARABIZI, ARABIC, or MIXED");
   }

   return errors;
}

function getMessageData(message) {
   return {
      role: message.role,
      content: message.content.trim(),
      language: message.language
   };
}

module.exports = {
   validateCreateConversation,
   validateAddMessage,
   getMessageData
};
