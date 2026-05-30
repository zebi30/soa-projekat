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

const addTransportTime = asyncHandler(async (req, res) => {
  const transportTime = await tourService.addTransportTime(req.user.sub, req.params.id, req.body);

  res.status(201).json({
    message: "Transport time added successfully.",
    transportTime
  });
});

const listTransportTimes = asyncHandler(async (req, res) => {
  const transportTimes = await tourService.listTransportTimes(req.user.sub, req.params.id);

  res.status(200).json({ transportTimes });
});

const publishTour = asyncHandler(async (req, res) => {
  const tour = await tourService.publishTour(req.user.sub, req.params.id);

  res.status(200).json({
    message: "Tour published successfully.",
    tour
  });
});

const archiveTour = asyncHandler(async (req, res) => {
  const tour = await tourService.archiveTour(req.user.sub, req.params.id);

  res.status(200).json({
    message: "Tour archived successfully.",
    tour
  });
});

const activateTour = asyncHandler(async (req, res) => {
  const tour = await tourService.activateTour(req.user.sub, req.params.id);

  res.status(200).json({
    message: "Tour activated successfully.",
    tour
  });
});

const listPublishedTours = asyncHandler(async (_req, res) => {
  const tours = await tourService.listPublishedTours();

  res.status(200).json({ tours });
});

module.exports = {
  createTour,
  getMyTours,
  getTourById,
  addTransportTime,
  listTransportTimes,
  publishTour,
  archiveTour,
  activateTour,
  listPublishedTours
};
