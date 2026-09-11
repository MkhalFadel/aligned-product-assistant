const aiService = require("./aiService");

const fallbackHighRiskThreshold = 30;

// Higher weights reflect errors that could materially mislead a recommendation.
const severityWeights = {
   nonexistentProduct: 4,
   incorrectPrice: 3,
   inventedSpecification: 3,
   incorrectComparison: 2,
   weakSuitability: 1
};

const criticalSeverityKeys = new Set([
   "nonexistentProduct",
   "incorrectPrice",
   "inventedSpecification"
]);

function createScoringError(message, code) {
   const error = new Error(message);
   error.code = code;

   return error;
}

function clampScore(value) {
   return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeText(value) {
   return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
}

function normalizeField(value) {
   return String(value || "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
}

function getAttributeValues(products, field) {
   return products
      .map((product) => product.attributes?.[field])
      .filter((value) => typeof value === "string");
}

function buildAssistantText(assistantAnswer, recommendations) {
   const reasons = recommendations
      .map((recommendation) => recommendation.reason)
      .filter((reason) => typeof reason === "string" && reason.trim() !== "");

   return [assistantAnswer, ...reasons].join("\n");
}

function getRelevantProducts(assistantText, recommendations, activeProducts) {
   const productsById = new Map(activeProducts.map((product) => [product.id, product]));
   const relevantProducts = new Map();
   const normalizedAnswer = assistantText.toLowerCase();

   recommendations.forEach((recommendation) => {
      const product = productsById.get(recommendation.productId);

      if (product) {
         relevantProducts.set(product.id, product);
      }
   });

   activeProducts.forEach((product) => {
      if (normalizedAnswer.includes(product.name.toLowerCase())) {
         relevantProducts.set(product.id, product);
      }
   });

   return [...relevantProducts.values()];
}

function addFinding(findings, seenFindings, finding) {
   const key = `${finding.field}:${normalizeText(finding.value)}`;

   if (!seenFindings.has(key)) {
      seenFindings.add(key);
      findings.push(finding);
   }
}

function getPriceFindings(assistantText, relevantProducts, activeProducts, findings, seenFindings) {
   const pricePattern = /\$\s?(\d+(?:\.\d{1,2})?)/g;
   let match;

   while ((match = pricePattern.exec(assistantText)) !== null) {
      const context = assistantText.slice(
         Math.max(0, match.index - 20),
         Math.min(assistantText.length, match.index + match[0].length + 20)
      ).toLowerCase();

      if (/budget|under|within|below|around|up to|less than/.test(context)) {
         continue;
      }

      const price = Number(match[1]);
      const products = relevantProducts.length > 0 ? relevantProducts : activeProducts;
      const isSupported = products.some((product) => Number(product.price) === price);

      addFinding(findings, seenFindings, {
         text: `Price $${match[1]}`,
         claimType: "exact_fact",
         field: "price",
         value: match[1],
         assessment: isSupported ? "SUPPORTED" : "UNSUPPORTED",
         severityKey: "incorrectPrice",
         source: "deterministic"
      });
   }
}

function getWeightFindings(assistantText, activeProducts, findings, seenFindings) {
   const weights = new Set(getAttributeValues(activeProducts, "weight").map(normalizeText));
   const weightPattern = /\b(\d+(?:\.\d+)?)\s?kg\b/gi;
   let match;

   while ((match = weightPattern.exec(assistantText)) !== null) {
      const value = `${match[1]}kg`;

      addFinding(findings, seenFindings, {
         text: `Weight ${value}`,
         claimType: "exact_fact",
         field: "weight",
         value,
         assessment: weights.has(normalizeText(value)) ? "SUPPORTED" : "UNSUPPORTED",
         severityKey: "inventedSpecification",
         source: "deterministic"
      });
   }
}

function getRamFindings(assistantText, activeProducts, findings, seenFindings) {
   const ramValues = new Set(
      getAttributeValues(activeProducts, "ram")
         .map((value) => value.match(/\d+\s?GB/i)?.[0])
         .filter(Boolean)
         .map(normalizeText)
   );
   const ramPattern = /\b(\d+)\s?GB(?:\s+(?:LPDDR\dX?|DDR\d))?\s+RAM\b/gi;
   let match;

   while ((match = ramPattern.exec(assistantText)) !== null) {
      const value = `${match[1]}GB RAM`;

      addFinding(findings, seenFindings, {
         text: `RAM ${value}`,
         claimType: "exact_fact",
         field: "ram",
         value,
         assessment: ramValues.has(normalizeText(`${match[1]}GB`)) ? "SUPPORTED" : "UNSUPPORTED",
         severityKey: "inventedSpecification",
         source: "deterministic"
      });
   }
}

function getGpuFindings(assistantText, activeProducts, findings, seenFindings) {
   const gpuValues = getAttributeValues(activeProducts, "gpu").map(normalizeText);
   const gpuPattern = /\b(?:NVIDIA\s+GeForce\s+)?RTX\s+\d{3,4}(?:\s+(?:SUPER|Laptop\s+GPU))?\b/gi;
   let match;

   while ((match = gpuPattern.exec(assistantText)) !== null) {
      const value = match[0];
      const normalizedValue = normalizeText(value);
      const isSupported = gpuValues.some((gpu) => gpu.includes(normalizedValue) || normalizedValue.includes(gpu));

      addFinding(findings, seenFindings, {
         text: `GPU ${value}`,
         claimType: "exact_fact",
         field: "gpu",
         value,
         assessment: isSupported ? "SUPPORTED" : "UNSUPPORTED",
         severityKey: "inventedSpecification",
         source: "deterministic"
      });
   }
}

function getResolutionFindings(assistantText, activeProducts, findings, seenFindings) {
   const resolutions = new Set(
      [...getAttributeValues(activeProducts, "resolution"), ...getAttributeValues(activeProducts, "display")]
         .map(normalizeText)
   );
   const resolutionPattern = /\b(\d{3,4}\s*x\s*\d{3,4})\b/gi;
   let match;

   while ((match = resolutionPattern.exec(assistantText)) !== null) {
      const value = match[1];
      const normalizedValue = normalizeText(value);
      const isSupported = [...resolutions].some((resolution) => resolution.includes(normalizedValue));

      addFinding(findings, seenFindings, {
         text: `Resolution ${value}`,
         claimType: "exact_fact",
         field: "resolution",
         value,
         assessment: isSupported ? "SUPPORTED" : "UNSUPPORTED",
         severityKey: "inventedSpecification",
         source: "deterministic"
      });
   }
}

function escapeRegExp(value) {
   return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getWeightInKilograms(product) {
   const weight = product.attributes?.weight;
   const match = typeof weight === "string" && weight.match(/(\d+(?:\.\d+)?)\s*kg/i);

   return match ? Number(match[1]) : null;
}

function getComparisonFindings(assistantText, activeProducts, findings, seenFindings) {
   const productNames = activeProducts
      .map((product) => product.name)
      .sort((firstName, secondName) => secondName.length - firstName.length);

   if (productNames.length < 2) {
      return;
   }

   const productByName = new Map(activeProducts.map((product) => [product.name.toLowerCase(), product]));
   const productNamePattern = productNames.map(escapeRegExp).join("|");
   const comparisonDefinitions = [
      {
         comparison: "lighter than",
         field: "weightComparison",
         getValue: getWeightInKilograms,
         isSupported: (firstValue, secondValue) => firstValue < secondValue
      },
      {
         comparison: "heavier than",
         field: "weightComparison",
         getValue: getWeightInKilograms,
         isSupported: (firstValue, secondValue) => firstValue > secondValue
      },
      {
         comparison: "cheaper than",
         field: "priceComparison",
         getValue: (product) => Number(product.price),
         isSupported: (firstValue, secondValue) => firstValue < secondValue
      },
      {
         comparison: "more expensive than",
         field: "priceComparison",
         getValue: (product) => Number(product.price),
         isSupported: (firstValue, secondValue) => firstValue > secondValue
      }
   ];

   comparisonDefinitions.forEach((definition) => {
      const pattern = new RegExp(
         `(?:the\\s+)?(${productNamePattern})\\s+is\\s+${definition.comparison}\\s+(?:the\\s+)?(${productNamePattern})`,
         "gi"
      );
      let match;

      while ((match = pattern.exec(assistantText)) !== null) {
         const firstProduct = productByName.get(match[1].toLowerCase());
         const secondProduct = productByName.get(match[2].toLowerCase());
         const firstValue = definition.getValue(firstProduct);
         const secondValue = definition.getValue(secondProduct);

         if (!Number.isFinite(firstValue) || !Number.isFinite(secondValue)) {
            continue;
         }

         addFinding(findings, seenFindings, {
            text: `${firstProduct.name} is ${definition.comparison} ${secondProduct.name}`,
            claimType: "comparison",
            field: definition.field,
            value: `${firstProduct.id}:${definition.comparison}:${secondProduct.id}`,
            assessment: definition.isSupported(firstValue, secondValue) ? "SUPPORTED" : "UNSUPPORTED",
            severityKey: "incorrectComparison",
            source: "deterministic"
         });
      }
   });
}

function getDeterministicFindings(assistantAnswer, recommendations, activeProducts) {
   const findings = [];
   const seenFindings = new Set();
   const productsById = new Map(activeProducts.map((product) => [product.id, product]));
   const assistantText = buildAssistantText(assistantAnswer, recommendations);
   const normalizedAnswer = assistantText.toLowerCase();
   const relevantProducts = getRelevantProducts(assistantText, recommendations, activeProducts);

   recommendations.forEach((recommendation) => {
      const product = productsById.get(recommendation.productId);

      addFinding(findings, seenFindings, {
         text: `Recommended product ID ${recommendation.productId}`,
         claimType: "exact_fact",
         field: "productId",
         value: recommendation.productId,
         assessment: product ? "SUPPORTED" : "UNSUPPORTED",
         severityKey: "nonexistentProduct",
         source: "deterministic"
      });
   });

   activeProducts.forEach((product) => {
      if (normalizedAnswer.includes(product.name.toLowerCase())) {
         addFinding(findings, seenFindings, {
            text: `Product name ${product.name}`,
            claimType: "exact_fact",
            field: "productName",
            value: product.name,
            assessment: "SUPPORTED",
            severityKey: "nonexistentProduct",
            source: "deterministic"
         });
      }
   });

   getPriceFindings(assistantText, relevantProducts, activeProducts, findings, seenFindings);
   getWeightFindings(assistantText, activeProducts, findings, seenFindings);
   getRamFindings(assistantText, activeProducts, findings, seenFindings);
   getGpuFindings(assistantText, activeProducts, findings, seenFindings);
   getResolutionFindings(assistantText, activeProducts, findings, seenFindings);
   getComparisonFindings(assistantText, activeProducts, findings, seenFindings);

   return findings;
}

function getSeverityKey(claim) {
   const field = normalizeField(claim.field);

   if (field === "productid" || field === "productname" || field === "name") {
      return "nonexistentProduct";
   }

   if (field === "price") {
      return "incorrectPrice";
   }

   if (claim.claimType === "comparison") {
      return "incorrectComparison";
   }

   if (claim.claimType === "suitability") {
      return "weakSuitability";
   }

   return "inventedSpecification";
}

function isResolvedDeterministically(claim, deterministicFindings) {
   const field = normalizeField(claim.field);
   const value = normalizeText(claim.value);

   return deterministicFindings.some((finding) => (
      normalizeField(finding.field) === field
      && normalizeText(finding.value) === value
   ));
}

function getSemanticFindings(claims, deterministicFindings, activeProducts) {
   const activeProductIds = new Set(activeProducts.map((product) => product.id));

   return claims.reduce((findings, claim) => {
      if (claim.assessment === "NOT_APPLICABLE" || isResolvedDeterministically(claim, deterministicFindings)) {
         return findings;
      }

      const assessment = claim.productId && !activeProductIds.has(claim.productId)
         ? "UNSUPPORTED"
         : claim.assessment;

      findings.push({
         ...claim,
         assessment,
         severityKey: getSeverityKey(claim),
         source: "semantic"
      });

      return findings;
   }, []);
}

function calculateScores(findings) {
   const factualClaims = findings.filter((finding) => (
      finding.assessment === "SUPPORTED" || finding.assessment === "UNSUPPORTED"
   ));

   if (factualClaims.length === 0) {
      // Conversational replies without factual claims are treated as neutral, low-risk.
      return {
         accuracyScore: 100,
         hallucinationRisk: 0,
         totalClaims: 0,
         supportedClaims: 0,
         unsupportedClaims: 0
      };
   }

   const supportedClaims = factualClaims.filter((finding) => finding.assessment === "SUPPORTED").length;
   const unsupportedFindings = factualClaims.filter((finding) => finding.assessment === "UNSUPPORTED");
   const totalWeight = factualClaims.reduce((total, finding) => (
      total + severityWeights[finding.severityKey]
   ), 0);
   const unsupportedWeight = unsupportedFindings.reduce((total, finding) => (
      total + severityWeights[finding.severityKey]
   ), 0);

   return {
      accuracyScore: clampScore((supportedClaims / factualClaims.length) * 100),
      hallucinationRisk: clampScore((unsupportedWeight / totalWeight) * 100),
      totalClaims: factualClaims.length,
      supportedClaims,
      unsupportedClaims: unsupportedFindings.length
   };
}

function resolveHighRiskThreshold(value) {
   const threshold = Number(value);

   if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
      return fallbackHighRiskThreshold;
   }

   return threshold;
}

function isCompatibilityClaim(finding) {
   const field = normalizeField(finding.field);

   return field.includes("compatibility") || field.includes("platform");
}

function getCriticalFlagReason(finding) {
   if (finding.severityKey === "nonexistentProduct") {
      return "Nonexistent product";
   }

   if (finding.severityKey === "incorrectPrice") {
      return "Incorrect price";
   }

   if (isCompatibilityClaim(finding)) {
      return "Invented compatibility";
   }

   return "Invented specification";
}

function getFlagReasons(findings, hallucinationRisk, threshold) {
   const criticalReasons = findings
      .filter((finding) => (
         finding.assessment === "UNSUPPORTED"
         && (criticalSeverityKeys.has(finding.severityKey) || isCompatibilityClaim(finding))
      ))
      .map(getCriticalFlagReason);
   const flagReasons = [...new Set(criticalReasons)];

   if (hallucinationRisk >= threshold) {
      flagReasons.push("Hallucination risk meets the high-risk threshold");
   }

   return flagReasons;
}

function buildScoreResult(findings, highRiskThreshold, scoringMode = "FULL") {
   const scores = calculateScores(findings);
   const threshold = resolveHighRiskThreshold(highRiskThreshold);
   const flagReasons = getFlagReasons(findings, scores.hallucinationRisk, threshold);

   return {
      accuracyScore: scores.accuracyScore,
      hallucinationRisk: scores.hallucinationRisk,
      // Critical catalogue errors trigger review even below the aggregate risk threshold.
      isFlagged: flagReasons.length > 0,
      scoringMode,
      details: {
         totalClaims: scores.totalClaims,
         supportedClaims: scores.supportedClaims,
         unsupportedClaims: scores.unsupportedClaims,
         flagReasons,
         deterministicFailures: findings.filter((finding) => (
            finding.source === "deterministic" && finding.assessment === "UNSUPPORTED"
         )),
         semanticFindings: findings.filter((finding) => finding.source === "semantic")
      }
   };
}

function getDeterministicFallbackScore(deterministicFindings, highRiskThreshold) {
   const scoreResult = buildScoreResult(
      deterministicFindings,
      highRiskThreshold,
      "DETERMINISTIC_FALLBACK"
   );

   return {
      ...scoreResult,
      isFlagged: true,
      scoringMode: "DETERMINISTIC_FALLBACK",
      details: {
         ...scoreResult.details,
         flagReasons: [...new Set([...scoreResult.details.flagReasons, "Semantic scoring unavailable"])],
         deterministicFailures: deterministicFindings.filter((finding) => (
            finding.source === "deterministic" && finding.assessment === "UNSUPPORTED"
         )),
         semanticFindings: []
      }
   };
}

function getUltimateConservativeScore() {
   return {
      accuracyScore: 0,
      hallucinationRisk: 100,
      isFlagged: true,
      scoringMode: "DETERMINISTIC_FALLBACK",
      details: {
         totalClaims: 0,
         supportedClaims: 0,
         unsupportedClaims: 0,
         flagReasons: ["Scoring fallback unavailable"],
         deterministicFailures: [],
         semanticFindings: []
      }
   };
}

async function scoreAssistantResponse({
   customerMessage,
   assistantAnswer,
   recommendations,
   activeProducts,
   highRiskThreshold
}) {
   if (typeof assistantAnswer !== "string" || assistantAnswer.trim() === "") {
      throw createScoringError("Assistant answer is required for scoring", "SCORING_ERROR");
   }

   let deterministicFindings;

   try {
      deterministicFindings = getDeterministicFindings(
         assistantAnswer,
         recommendations,
         activeProducts
      );
   } catch (error) {
      console.error("Deterministic scoring failed; using conservative scores", {
         name: error.name,
         code: error.code
      });

      return getUltimateConservativeScore();
   }

   try {
      const semanticClaims = await aiService.evaluateAssistantClaims({
         customerMessage,
         assistantAnswer,
         recommendations,
         catalogue: activeProducts,
         deterministicFindings
      });
      const semanticFindings = getSemanticFindings(
         semanticClaims,
         deterministicFindings,
         activeProducts
      );
      return buildScoreResult(
         [...deterministicFindings, ...semanticFindings],
         highRiskThreshold
      );
   } catch (error) {
      console.warn("Semantic scoring unavailable; using deterministic fallback", {
         code: error.code
      });
      try {
         return getDeterministicFallbackScore(deterministicFindings, highRiskThreshold);
      } catch (fallbackError) {
         console.error("Deterministic scoring fallback failed; using conservative scores", {
            name: fallbackError.name,
            code: fallbackError.code
         });

         return getUltimateConservativeScore();
      }
   }
}

module.exports = {
   scoreAssistantResponse
};
