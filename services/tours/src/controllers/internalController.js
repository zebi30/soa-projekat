const asyncHandler = require("../utils/asyncHandler");
const tourService = require("../services/tourService");

const getFullTour = asyncHandler(async (req, res) => {
  const tour = await tourService.getFullTourById(req.params.id);

  if (!tour) {
    return res.status(404).json({ message: "Tour not found." });
  }

  res.status(200).json({ tour });
});

module.exports = {
  getFullTour
};
