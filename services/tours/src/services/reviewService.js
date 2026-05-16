const mongoose = require("mongoose");

const Review = require("../models/Review");
const Tour = require("../models/Tour");

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function validateReviewInput({ rating, comment, visitedAt, images }) {
  const parsedRating = Number(rating);
  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    throw createHttpError(400, "Rating must be an integer between 1 and 5.");
  }

  const trimmedComment = typeof comment === "string" ? comment.trim() : "";
  if (!trimmedComment) {
    throw createHttpError(400, "Comment is required.");
  }

  if (!visitedAt) {
    throw createHttpError(400, "visitedAt date is required.");
  }

  const parsedDate = new Date(visitedAt);
  if (isNaN(parsedDate.getTime())) {
    throw createHttpError(400, "visitedAt must be a valid date.");
  }

  if (parsedDate > new Date()) {
    throw createHttpError(400, "visitedAt cannot be in the future.");
  }

  let normalizedImages = [];
  if (images !== undefined && images !== null) {
    if (!Array.isArray(images)) {
      throw createHttpError(400, "Images must be an array of strings.");
    }
    normalizedImages = images
      .filter((img) => typeof img === "string")
      .map((img) => img.trim())
      .filter((img) => img.length > 0);
  }

  return {
    rating: parsedRating,
    comment: trimmedComment,
    visitedAt: parsedDate,
    images: normalizedImages
  };
}

async function createReview(touristId, touristEmail, tourId, input) {
  if (!isValidObjectId(tourId)) {
    throw createHttpError(400, "Invalid tour id.");
  }

  const tour = await Tour.findById(tourId);
  if (!tour) {
    throw createHttpError(404, "Tour not found.");
  }

  const data = validateReviewInput(input);

  const review = await Review.create({
    tourId,
    touristId: String(touristId),
    touristEmail,
    ...data
  });

  return review.toJSON();
}

async function listReviewsForTour(tourId) {
  if (!isValidObjectId(tourId)) {
    throw createHttpError(400, "Invalid tour id.");
  }

  const tour = await Tour.findById(tourId);
  if (!tour) {
    throw createHttpError(404, "Tour not found.");
  }

  const reviews = await Review.find({ tourId }).sort({ createdAt: -1 });
  return reviews.map((r) => r.toJSON());
}

module.exports = {
  createReview,
  listReviewsForTour
};
