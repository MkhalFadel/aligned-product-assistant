const allowedFeedbackFields = ["rating", "comment"];

function isPlainObject(value) {
   if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return false;
   }

   const prototype = Object.getPrototypeOf(value);

   return prototype === Object.prototype || prototype === null;
}

function validateFeedback(body) {
   const errors = [];

   if (!isPlainObject(body)) {
      return ["request body must be a plain object"];
   }

   Object.keys(body).forEach((field) => {
      if (!allowedFeedbackFields.includes(field)) {
         errors.push(`${field} is not allowed`);
      }
   });

   if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
      errors.push("rating must be an integer from 1 to 5");
   }

   if (body.comment !== undefined && typeof body.comment !== "string") {
      errors.push("comment must be a string");
   }

   return errors;
}

function getFeedbackData(body) {
   const comment = body.comment?.trim();

   return {
      rating: body.rating,
      comment: comment || null
   };
}

module.exports = {
   validateFeedback,
   getFeedbackData
};
