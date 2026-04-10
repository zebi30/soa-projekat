const express = require("express");
const cors = require("cors");

require("./config/env");

const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/auth", authRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found."
  });
});

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error.";

  res.status(statusCode).json({
    message
  });
});

module.exports = app;
