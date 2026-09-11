const express = require("express");
const cors = require("cors");
const conversationRoutes = require("./routes/conversationRoutes");
const productRoutes = require("./routes/productRoutes");
const reportRoutes = require("./routes/reportRoutes");
const assistantSettingsRoutes = require("./routes/assistantSettingsRoutes");

const app = express();
const configuredOrigins = [
   process.env.FRONTEND_URL,
   ...(process.env.FRONTEND_URLS || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
];

const localFrontendOrigins = [
   "http://localhost:5173",
   "http://127.0.0.1:5173",
   ...configuredOrigins
];
const configuredFrontendOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "")
   .split(",")
   .map((origin) => origin.trim().replace(/\/$/, ""))
   .filter(Boolean);
const allowedOrigins = new Set([...localFrontendOrigins, ...configuredFrontendOrigins]);

// Trust the single hosting proxy layer so request IPs are available to the limiter.
app.set("trust proxy", 1);
app.use(cors({
   origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
         return callback(null, true);
      }

      return callback(new Error("Origin is not allowed by CORS"));
   }
}));
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (req, res) => {
   return res.status(200).json({ status: "ok" });
});

// Mount the product catalogue API.
app.use("/api/products", productRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", assistantSettingsRoutes);

// Keep unexpected errors out of API responses while logging them server-side.
app.use((error, req, res, next) => {
   if (error.type === "entity.too.large") {
      return res.status(413).json({ message: "Request body is too large" });
   }

   console.error(error);

   res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
