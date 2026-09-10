const express = require("express");
const cors = require("cors");
const conversationRoutes = require("./routes/conversationRoutes");
const productRoutes = require("./routes/productRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

// Trust the single hosting proxy layer so request IPs are available to the limiter.
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json({ limit: "10kb" }));

// Mount the product catalogue API.
app.use("/api/products", productRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/reports", reportRoutes);

// Keep unexpected errors out of API responses while logging them server-side.
app.use((error, req, res, next) => {
   if (error.type === "entity.too.large") {
      return res.status(413).json({ message: "Request body is too large" });
   }

   console.error(error);

   res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
