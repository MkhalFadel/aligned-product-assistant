// Restores line breaks when a model returns sentence-separated bullet markers inline.
function normalizeAssistantFormatting(content) {
   if (typeof content !== "string") {
      return content;
   }

   return content.replace(/([.!?:])[ \t]+([-*])[ \t]+/g, "$1\n$2 ");
}

module.exports = {
   normalizeAssistantFormatting
};
