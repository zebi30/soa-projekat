const asyncHandler = require("../utils/asyncHandler");
const reviewService = require("../services/reviewService");

const createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(
    req.user.sub,
    req.user.email,
    req.params.id,
    req.body
  );

  res.status(201).json({
    message: "Review created successfully.",
    review
  });
});

const getReviews = asyncHandler(async (req, res) => {
  const reviews = await reviewService.listReviewsForTour(req.params.id);

  res.status(200).json({ reviews });
});

module.exports = {
  createReview,
  getReviews
};
