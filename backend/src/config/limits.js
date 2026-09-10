function getPositiveInteger(name, fallback) {
   const value = Number(process.env[name]);

   return Number.isInteger(value) && value > 0 ? value : fallback;
}

const aiRateLimitMax = getPositiveInteger("AI_RATE_LIMIT_MAX", 20);
const aiRateLimitWindowMinutes = getPositiveInteger("AI_RATE_LIMIT_WINDOW_MINUTES", 60);
const maxMessagesPerConversation = getPositiveInteger("MAX_MESSAGES_PER_CONVERSATION", 15);
const maxMessageLength = getPositiveInteger("MAX_MESSAGE_LENGTH", 1000);

module.exports = {
   aiRateLimitMax,
   aiRateLimitWindowMinutes,
   maxMessagesPerConversation,
   maxMessageLength
};
