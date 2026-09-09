const express = require("express");
const reportController = require("../controllers/reportController");
const validate = require("../middleware/validate");
const { validateFeedback } = require("../validators/reportValidator");

const router = express.Router();

router.get("/:token", reportController.getReportByToken);
router.post("/:token/feedback", validate(validateFeedback), reportController.submitFeedback);

module.exports = router;
