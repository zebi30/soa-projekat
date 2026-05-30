const asyncHandler = require("../utils/asyncHandler");
const tourExecutionService = require("../services/tourExecutionService");

const startExecution = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.body;
  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ message: "latitude and longitude are required." });
  }

  const execution = await tourExecutionService.startExecution(
    req.user.sub,
    req.headers.authorization,
    req.params.id,
    { latitude, longitude }
  );

  res.status(201).json({ message: "Tour execution started.", execution });
});

const completeExecution = asyncHandler(async (req, res) => {
  const execution = await tourExecutionService.completeExecution(
    req.user.sub,
    req.params.id
  );
  res.status(200).json({ message: "Tour execution completed.", execution });
});

const abandonExecution = asyncHandler(async (req, res) => {
  const execution = await tourExecutionService.abandonExecution(
    req.user.sub,
    req.params.id
  );
  res.status(200).json({ message: "Tour execution abandoned.", execution });
});

const checkPosition = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.body;
  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ message: "latitude and longitude are required." });
  }

  const result = await tourExecutionService.checkPosition(
    req.user.sub,
    req.params.id,
    { latitude, longitude }
  );

  res.status(200).json(result);
});

const getActiveExecution = asyncHandler(async (req, res) => {
  const execution = await tourExecutionService.getActiveExecution(req.user.sub);
  res.status(200).json({ execution });
});

module.exports = {
  startExecution,
  completeExecution,
  abandonExecution,
  checkPosition,
  getActiveExecution
};
