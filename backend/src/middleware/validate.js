// Validates product input before it reaches the controller.
function validate(validator) {
   return (req, res, next) => {
      const errors = validator(req.body);

      if (errors.length > 0) {
         return res.status(400).json({
            message: errors[0]
         });
      }

      return next();
   };
}

module.exports = validate;
