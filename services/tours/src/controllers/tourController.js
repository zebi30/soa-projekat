const asyncHandler = require("../utils/asyncHandler");
const tourService = require("../services/tourService");

const createTour = asyncHandler(async (req, res) => {
  const tour = await tourService.createTour(req.user.sub, req.body);

  res.status(201).json({
    message: "Tour created successfully.",
    tour
  });
});

const getMyTours = asyncHandler(async (req, res) => {
  const tours = await tourService.listMyTours(req.user.sub);

  res.status(200).json({ tours });
});

const getTourById = asyncHandler(async (req, res) => {
  const tour = await tourService.getTourById(req.user.sub, req.params.id);

  res.status(200).json({ tour });
});

module.exports = {
  createTour,
  getMyTours,
  getTourById
};
