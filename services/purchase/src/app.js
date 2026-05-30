const express = require("express");
const cors = require("cors");

require("./config/env");

const healthRoutes = require("./routes/healthRoutes");
const cartRoutes = require("./routes/cartRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/purchases", purchaseRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found."
  });
});

app.use((error, req, res, next) => {
  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: error.message
    });
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error.";

  res.status(statusCode).json({
    message
  });
});

module.exports = app;
