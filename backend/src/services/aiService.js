const { GoogleGenAI } = require("@google/genai");

const allowedLanguages = ["ENGLISH", "ARABIZI", "ARABIC", "MIXED"];
const allowedClaimTypes = ["exact_fact", "comparison", "suitability", "subjective", "unknown"];
const allowedClaimAssessments = ["SUPPORTED", "UNSUPPORTED", "SUBJECTIVE_REASONABLE", "NOT_APPLICABLE"];
const defaultModel = "gemini-3.1-flash-lite";
const requestTimeoutMs = 20000;

const responseSchema = {
   type: "object",
   additionalProperties: false,
   properties: {
      answer: { type: "string" },
      language: {
         type: "string",
         enum: allowedLanguages
      },
      recommendedProducts: {
         type: "array",
         items: {
            type: "object",
            additionalProperties: false,
            properties: {
               productId: { type: "string" },
               reason: { type: "string" }
            },
            required: ["productId", "reason"]
         }
      }
   },
   required: ["answer", "language", "recommendedProducts"]
};

const claimEvaluationSchema = {
   type: "object",
   additionalProperties: false,
   properties: {
      claims: {
         type: "array",
         items: {
            type: "object",
            additionalProperties: false,
            properties: {
               text: { type: "string" },
               productId: { type: ["string", "null"] },
               claimType: {
                  type: "string",
                  enum: allowedClaimTypes
               },
               field: { type: ["string", "null"] },
               value: { type: ["string", "null"] },
               assessment: {
                  type: "string",
                  enum: allowedClaimAssessments
               }
            },
            required: ["text", "claimType", "assessment"]
         }
      }
   },
   required: ["claims"]
};

const summarySchema = {
   type: "object",
   additionalProperties: false,
   properties: {
      summary: { type: "string" }
   },
   required: ["summary"]
};

function createAiError(message, code) {
   const error = new Error(message);
   error.code = code;

   return error;
}

function isPlainObject(value) {
   if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return false;
   }

   const prototype = Object.getPrototypeOf(value);

   return prototype === Object.prototype || prototype === null;
}

function getLanguageInstruction(language) {
   const instructions = {
      ENGLISH: "Write the answer and recommendation reasons in clear English.",
      ARABIZI: [
         "Write the answer and recommendation reasons in concise, conversational Lebanese Arabizi.",
         "Prefer natural Lebanese sentence structure instead of literal Arabic translation, and do not force formal Arabic expressions into Arabizi.",
         "Do not insert Arabic script. Natural English technical terms such as laptop, RAM, gaming, budget, coding, monitor, and controller are acceptable.",
         "Do not overuse numbers unless they are natural in the response.",
         "Keep catalogue claims direct: say the listed detail instead of saying a specification is enough or capable for a task unless the catalogue says so.",
         "Use these examples for tone only and never reuse their details as catalogue facts:",
         'User: "bade laptop lal jem3a w coding, budget around 1000$"',
         'Natural style: "iza ahamm shi 3endak l jem3a w coding, hayda l option byenzabak aktar..."',
         'User: "ayye wahad akhaf?"',
         'Natural style: "hayda akhaf, wazno 1.5kg, fa byekun ashal bel tan2ol..."'
      ].join("\n"),
      ARABIC: "Write the answer and recommendation reasons in Arabic script.",
      MIXED: "Write the answer and recommendation reasons in the dominant style of the customer's mixed-language message."
   };

   return instructions[language];
}

function buildInstructions(language) {
   return [
      "You are a grounded consumer computer hardware catalogue assistant.",
      "Only recommend products from the supplied active catalogue.",
      "Never invent product names, product IDs, prices, specifications, compatibility, features, or comparison claims.",
      "Do not infer unlisted technical benefits from a catalogue specification or call a specification suitable, capable, or powerful for a task unless the catalogue explicitly says so.",
      "Recommendation reasons must cite only the product details explicitly present in the catalogue.",
      "Every recommended product must use its exact productId from the catalogue.",
      "If no catalogue product fits, clearly say the catalogue does not contain a suitable option and return an empty recommendedProducts array.",
      "Use only catalogue data when explaining recommendations or comparisons.",
      getLanguageInstruction(language)
   ].join("\n");
}

function buildModelContents(history, catalogue) {
   const contents = history.map((message) => ({
      role: message.role === "USER" ? "user" : "model",
      parts: [{ text: message.content }]
   }));
   const catalogueContext = `Use this active catalogue as the only product source: ${JSON.stringify(catalogue)}`;
   const latestMessage = contents[contents.length - 1];

   if (latestMessage?.role === "user") {
      latestMessage.parts[0].text = `${latestMessage.parts[0].text}\n\n${catalogueContext}`;
   } else {
      contents.push({
         role: "user",
         parts: [{ text: catalogueContext }]
      });
   }

   return contents;
}

function validateRecommendation(recommendation) {
   return isPlainObject(recommendation)
      && typeof recommendation.productId === "string"
      && recommendation.productId.trim() !== ""
      && typeof recommendation.reason === "string"
      && recommendation.reason.trim() !== "";
}

function isNullableString(value) {
   return value === undefined || value === null || typeof value === "string";
}

function validateClaim(claim) {
   return isPlainObject(claim)
      && typeof claim.text === "string"
      && claim.text.trim() !== ""
      && isNullableString(claim.productId)
      && allowedClaimTypes.includes(claim.claimType)
      && isNullableString(claim.field)
      && isNullableString(claim.value)
      && allowedClaimAssessments.includes(claim.assessment);
}

// Validates structured output before application code can persist it.
function parseAssistantResponse(responseText) {
   let output;

   try {
      output = JSON.parse(responseText);
   } catch {
      throw createAiError("AI provider returned malformed structured output", "GEMINI_RESPONSE_ERROR");
   }

   if (!isPlainObject(output)
      || typeof output.answer !== "string"
      || output.answer.trim() === ""
      || !allowedLanguages.includes(output.language)
      || !Array.isArray(output.recommendedProducts)
      || !output.recommendedProducts.every(validateRecommendation)) {
      throw createAiError("AI provider returned invalid structured output", "GEMINI_RESPONSE_ERROR");
   }

   return {
      answer: output.answer.trim(),
      language: output.language,
      recommendedProducts: output.recommendedProducts.map((recommendation) => ({
         productId: recommendation.productId.trim(),
         reason: recommendation.reason.trim()
      }))
   };
}

function parseClaimEvaluation(responseText) {
   let output;

   try {
      output = JSON.parse(responseText);
   } catch {
      throw createAiError("Gemini returned malformed scoring output", "SCORING_RESPONSE_ERROR");
   }

   if (!isPlainObject(output)
      || !Array.isArray(output.claims)
      || !output.claims.every(validateClaim)) {
      throw createAiError("Gemini returned invalid scoring output", "SCORING_RESPONSE_ERROR");
   }

   return output.claims.map((claim) => ({
      text: claim.text.trim(),
      productId: claim.productId?.trim() || null,
      claimType: claim.claimType,
      field: claim.field?.trim() || null,
      value: claim.value?.trim() || null,
      assessment: claim.assessment
   }));
}

function parseConversationSummary(responseText) {
   let output;

   try {
      output = JSON.parse(responseText);
   } catch {
      throw createAiError("Gemini returned malformed summary output", "GEMINI_RESPONSE_ERROR");
   }

   if (!isPlainObject(output)
      || typeof output.summary !== "string"
      || output.summary.trim() === "") {
      throw createAiError("Gemini returned invalid summary output", "GEMINI_RESPONSE_ERROR");
   }

   return output.summary.trim();
}

function getClient() {
   const apiKey = process.env.GEMINI_API_KEY?.trim();

   if (!apiKey) {
      throw createAiError("GEMINI_API_KEY is not configured", "GEMINI_CONFIGURATION_ERROR");
   }

   return new GoogleGenAI({ apiKey });
}

function getResponseText(response) {
   const candidate = response.candidates?.[0];
   const blockedReasons = [
      "SAFETY",
      "RECITATION",
      "BLOCKLIST",
      "PROHIBITED_CONTENT",
      "SPII"
   ];

   if (response.promptFeedback?.blockReason
      || !candidate
      || blockedReasons.includes(candidate.finishReason)) {
      throw createAiError("Gemini blocked the response", "GEMINI_RESPONSE_ERROR");
   }

   if (typeof response.text !== "string" || response.text.trim() === "") {
      throw createAiError("Gemini returned an empty response", "GEMINI_RESPONSE_ERROR");
   }

   return response.text;
}

async function generateStructuredResponse({ instructions, contents, schema, maxOutputTokens }) {
   const controller = new AbortController();
   const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

   try {
      const client = getClient();
      const response = await client.models.generateContent({
         model: process.env.GEMINI_MODEL?.trim() || defaultModel,
         contents,
         config: {
            systemInstruction: instructions,
            temperature: 0.2,
            maxOutputTokens,
            responseMimeType: "application/json",
            responseJsonSchema: schema,
            abortSignal: controller.signal
         }
      });

      return getResponseText(response);
   } catch (error) {
      if (error.code === "GEMINI_CONFIGURATION_ERROR" || error.code === "GEMINI_RESPONSE_ERROR") {
         throw error;
      }

      console.error("Gemini response generation failed", {
         name: error.name,
         status: error.status,
         code: error.code
      });

      throw createAiError("Unable to generate an assistant response right now", "GEMINI_PROVIDER_ERROR");
   } finally {
      clearTimeout(timeout);
   }
}

function buildClaimEvaluatorInstructions() {
   return [
      "You are a strict consumer hardware catalogue claim evaluator.",
      "Use only the supplied catalogue and deterministic findings. Do not use external product knowledge.",
      "Extract factual claims from the assistant answer and recommendation reasons.",
      "Classify each claim as SUPPORTED, UNSUPPORTED, SUBJECTIVE_REASONABLE, or NOT_APPLICABLE.",
      "Use SUBJECTIVE_REASONABLE for a reasonable preference statement that is not an invented specification.",
      "Use NOT_APPLICABLE for claims already resolved by deterministic findings.",
      "Do not invent claims or product details."
   ].join("\n");
}

function buildSummaryInstructions(language) {
   const languageInstructions = {
      ENGLISH: "Write the summary in English.",
      ARABIZI: "Write the summary in natural Lebanese Arabizi without Arabic script.",
      ARABIC: "Write the summary in Arabic script.",
      // Mixed conversations use the dominant language or concise English when tied.
      MIXED: [
         "Write the entire summary in one natural language.",
         "If one USER-message language clearly dominates, use that language. If no language dominates, use concise English.",
         "Do not switch between English, Lebanese Arabizi, and Arabic script within the summary."
      ].join(" ")
   };

   return [
      "You summarize a customer's hardware-shopping request.",
      "Use only the supplied USER messages. Never use assistant messages, recommendations, or catalogue details.",
      "Synthesize the customer's needs instead of concatenating or repeating their messages.",
      "Combine repeated requirements and remove conversational filler while preserving explicitly stated budget, product category, intended use, portability, compatibility, and requested features.",
      "Do not add requirements, product facts, prices, specifications, or compatibility details the customer did not mention.",
      "Write a direct summary of the requirements rather than referring to the person as the customer.",
      "Keep the result customer-friendly and concise, ideally one to three sentences.",
      languageInstructions[language] || languageInstructions.MIXED
   ].join("\n");
}

// Calls the provider with strict JSON output and no access to database concerns.
async function generateAssistantResponse({ language, history, catalogue }) {
   const responseText = await generateStructuredResponse({
      instructions: buildInstructions(language),
      contents: buildModelContents(history, catalogue),
      schema: responseSchema,
      maxOutputTokens: 600
   });

   return parseAssistantResponse(responseText);
}

async function evaluateAssistantClaims({ customerMessage, assistantAnswer, recommendations, catalogue, deterministicFindings }) {
   const contents = [{
      role: "user",
      parts: [{
         text: JSON.stringify({
            customerMessage,
            assistantAnswer,
            recommendations,
            catalogue,
            deterministicFindings
         })
      }]
   }];
   const responseText = await generateStructuredResponse({
      instructions: buildClaimEvaluatorInstructions(),
      contents,
      schema: claimEvaluationSchema,
      maxOutputTokens: 800
   });

   return parseClaimEvaluation(responseText);
}

// Produces a cached report summary from customer messages without catalogue context.
async function generateConversationSummary({ messages, detectedLanguage }) {
   const contents = [{
      role: "user",
      parts: [{
         text: JSON.stringify({
            conversationLanguage: detectedLanguage,
            customerMessages: messages.map((message) => ({
               content: message.content,
               language: message.language
            }))
         })
      }]
   }];
   const responseText = await generateStructuredResponse({
      instructions: buildSummaryInstructions(detectedLanguage),
      contents,
      schema: summarySchema,
      maxOutputTokens: 160
   });

   return parseConversationSummary(responseText);
}

module.exports = {
   generateAssistantResponse,
   evaluateAssistantClaims,
   generateConversationSummary
};
