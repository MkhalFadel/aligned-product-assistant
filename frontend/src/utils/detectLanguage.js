const arabicScriptPattern = /[\u0600-\u06FF]/
const latinPattern = /[A-Za-z]/
const arabiziDigitPattern = /(?:[A-Za-z][235789]|[235789][A-Za-z])/i
const arabiziMarkerPattern = /\b(?:bade|baddi|shu|kif|mni7|lal|ykoun|hayda|ayye|iza|khalas)\b/i

// Uses a lightweight script and marker heuristic; Gemini remains responsible for language quality.
export function detectLanguage(message) {
   const hasArabicScript = arabicScriptPattern.test(message)
   const hasLatinText = latinPattern.test(message)

   if (hasArabicScript && hasLatinText) {
      return 'MIXED'
   }

   if (hasArabicScript) {
      return 'ARABIC'
   }

   if (hasLatinText && (arabiziDigitPattern.test(message) || arabiziMarkerPattern.test(message))) {
      return 'ARABIZI'
   }

   return 'ENGLISH'
}
