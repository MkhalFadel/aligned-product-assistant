const express = require("express");
const cors = require("cors");
const productRoutes = require("./routes/productRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Mount the product catalogue API.
app.use("/api/products", productRoutes);

// Keep unexpected errors out of API responses while logging them server-side.
app.use((error, req, res, next) => {
   console.error(error);

   res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
