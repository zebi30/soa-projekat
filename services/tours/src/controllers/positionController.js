const asyncHandler = require("../utils/asyncHandler");
const positionService = require("../services/positionService");

const getMyPosition = asyncHandler(async (req, res) => {
  const position = await positionService.getPosition(req.user.sub);

  if (!position) {
    return res.status(404).json({ message: "Position not set." });
  }

  res.status(200).json({ position });
});

const setMyPosition = asyncHandler(async (req, res) => {
  const position = await positionService.setPosition(req.user.sub, req.body);

  res.status(200).json({
    message: "Position updated successfully.",
    position
  });
});

module.exports = {
  getMyPosition,
  setMyPosition
};
