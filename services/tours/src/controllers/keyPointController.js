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

module.exports = {
  addKeyPoint,
  listKeyPoints
};
