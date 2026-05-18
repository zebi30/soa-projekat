const asyncHandler = require("../utils/asyncHandler");
const tourService = require("../services/tourService");

const addKeyPoint = asyncHandler(async (req, res) => {
  const keyPoint = await tourService.addKeyPoint(req.user.sub, req.params.id, req.body);

  res.status(201).json({
    message: "Key point added successfully.",
    keyPoint
  });
});

const listKeyPoints = asyncHandler(async (req, res) => {
  const keyPoints = await tourService.listKeyPoints(req.user.sub, req.params.id);

  res.status(200).json({ keyPoints });
});

const updateKeyPoint = asyncHandler(async (req, res) => {
  const keyPoint = await tourService.updateKeyPoint(
    req.user.sub,
    req.params.id,
    req.params.keyPointId,
    req.body
  );

  res.status(200).json({
    message: "Key point updated successfully.",
    keyPoint
  });
});

const deleteKeyPoint = asyncHandler(async (req, res) => {
  await tourService.deleteKeyPoint(req.user.sub, req.params.id, req.params.keyPointId);

  res.status(204).send();
});

module.exports = {
  addKeyPoint,
  listKeyPoints,
  updateKeyPoint,
  deleteKeyPoint
};
