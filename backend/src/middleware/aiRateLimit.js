const { rateLimit } = require("express-rate-limit");
const {
   aiRateLimitMax,
   aiRateLimitWindowMinutes
} = require("../config/limits");

// Limits only provider-triggering requests so public reads remain available.
const aiRateLimit = rateLimit({
   windowMs: aiRateLimitWindowMinutes * 60 * 1000,
   limit: aiRateLimitMax,
   standardHeaders: false,
   legacyHeaders: false,
   message: { message: "Too many requests. Please try again later." }
});

module.exports = aiRateLimit;
