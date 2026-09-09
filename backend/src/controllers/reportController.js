const reportService = require("../services/reportService");
const { getFeedbackData } = require("../validators/reportValidator");

async function getReportByToken(req, res, next) {
   try {
      const result = await reportService.getReportByToken(req.params.token);

      if (!result) {
         return res.status(404).json({ message: "Conversation report not found" });
      }

      if (!result.hasEnded) {
         return res.status(409).json({
            message: "Conversation report is available after the conversation ends"
         });
      }

      return res.status(200).json({ report: result.report });
   } catch (error) {
      return next(error);
   }
}

async function submitFeedback(req, res, next) {
   try {
      const feedbackData = getFeedbackData(req.body);
      const result = await reportService.submitFeedback(req.params.token, feedbackData);

      if (!result) {
         return res.status(404).json({ message: "Conversation report not found" });
      }

      if (!result.hasEnded) {
         return res.status(409).json({
            message: "Conversation report is available after the conversation ends"
         });
      }

      return res.status(200).json({ feedback: result.feedback });
   } catch (error) {
      return next(error);
   }
}

module.exports = {
   getReportByToken,
   submitFeedback
};
