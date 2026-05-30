const path = require("path");
const express = require("express");
const cors = require("cors");

require("./config/env");

const healthRoutes = require("./routes/healthRoutes");
const tourRoutes = require("./routes/tourRoutes");
const positionRoutes = require("./routes/positionRoutes");
const internalRoutes = require("./routes/internalRoutes");
const executionRoutes = require("./routes/executionRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/api/tours", tourRoutes);
app.use("/api/positions", positionRoutes);
app.use("/api/executions", executionRoutes);
app.use("/internal", internalRoutes);
app.use("/simulator", express.static(path.join(__dirname, "public", "simulator")));
app.use("/guide", express.static(path.join(__dirname, "public", "guide")));
app.use("/lifecycle", express.static(path.join(__dirname, "public", "lifecycle")));
app.use("/execution", express.static(path.join(__dirname, "public", "execution")));

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
