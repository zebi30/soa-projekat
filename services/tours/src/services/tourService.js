const mongoose = require("mongoose");

const Tour = require("../models/Tour");

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function validateTourInput({ name, description, difficulty, tags }) {
  const trimmedName = typeof name === "string" ? name.trim() : "";
  const trimmedDescription = typeof description === "string" ? description.trim() : "";
  const normalizedDifficulty = typeof difficulty === "string" ? difficulty.trim().toLowerCase() : "";

  if (!trimmedName || !trimmedDescription || !normalizedDifficulty) {
    throw createHttpError(400, "Name, description, and difficulty are required.");
  }

  if (!["easy", "medium", "hard"].includes(normalizedDifficulty)) {
    throw createHttpError(400, "Difficulty must be one of: easy, medium, hard.");
  }

  let normalizedTags = [];
  if (tags !== undefined && tags !== null) {
    if (!Array.isArray(tags)) {
      throw createHttpError(400, "Tags must be an array of strings.");
    }
    normalizedTags = tags
      .filter((tag) => typeof tag === "string")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }

  return {
    name: trimmedName,
    description: trimmedDescription,
    difficulty: normalizedDifficulty,
    tags: normalizedTags
  };
}

function validateKeyPointInput({ name, description, latitude, longitude, imageUrl }) {
  const trimmedName = typeof name === "string" ? name.trim() : "";
  const trimmedDescription = typeof description === "string" ? description.trim() : "";

  if (!trimmedName || !trimmedDescription) {
    throw createHttpError(400, "Key point name and description are required.");
  }

  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw createHttpError(400, "Latitude must be a number between -90 and 90.");
  }

  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw createHttpError(400, "Longitude must be a number between -180 and 180.");
  }

  const trimmedImageUrl =
    typeof imageUrl === "string" && imageUrl.trim().length > 0 ? imageUrl.trim() : null;

  return {
    name: trimmedName,
    description: trimmedDescription,
    latitude: lat,
    longitude: lon,
    imageUrl: trimmedImageUrl
  };
}

async function createTour(authorId, input) {
  const data = validateTourInput(input);

  const tour = await Tour.create({
    ...data,
    authorId: String(authorId),
    status: "draft",
    price: 0,
    keyPoints: []
  });

  return tour.toJSON();
}

async function listMyTours(authorId) {
  const tours = await Tour.find({ authorId: String(authorId) }).sort({ createdAt: -1 });
  return tours.map((tour) => tour.toJSON());
}

async function getOwnedTour(authorId, tourId) {
  if (!isValidObjectId(tourId)) {
    throw createHttpError(400, "Invalid tour id.");
  }

  const tour = await Tour.findById(tourId);

  if (!tour) {
    throw createHttpError(404, "Tour not found.");
  }

  if (String(tour.authorId) !== String(authorId)) {
    throw createHttpError(403, "You do not own this tour.");
  }

  return tour;
}

async function getTourById(authorId, tourId) {
  const tour = await getOwnedTour(authorId, tourId);
  return tour.toJSON();
}

async function addKeyPoint(authorId, tourId, input) {
  const data = validateKeyPointInput(input);
  const tour = await getOwnedTour(authorId, tourId);

  tour.keyPoints.push(data);
  await tour.save();

  const added = tour.keyPoints[tour.keyPoints.length - 1];

  return {
    id: added._id,
    name: added.name,
    description: added.description,
    latitude: added.latitude,
    longitude: added.longitude,
    imageUrl: added.imageUrl,
    createdAt: added.createdAt,
    updatedAt: added.updatedAt
  };
}

async function listKeyPoints(authorId, tourId) {
  const tour = await getOwnedTour(authorId, tourId);
  return tour.toJSON().keyPoints;
}

function validateKeyPointPatch({ name, description, latitude, longitude, imageUrl }) {
  const patch = {};

  if (name !== undefined) {
    const trimmed = typeof name === "string" ? name.trim() : "";
    if (!trimmed) {
      throw createHttpError(400, "Key point name cannot be empty.");
    }
    patch.name = trimmed;
  }

  if (description !== undefined) {
    const trimmed = typeof description === "string" ? description.trim() : "";
    if (!trimmed) {
      throw createHttpError(400, "Key point description cannot be empty.");
    }
    patch.description = trimmed;
  }

  if (latitude !== undefined) {
    const lat = Number(latitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      throw createHttpError(400, "Latitude must be a number between -90 and 90.");
    }
    patch.latitude = lat;
  }

  if (longitude !== undefined) {
    const lon = Number(longitude);
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      throw createHttpError(400, "Longitude must be a number between -180 and 180.");
    }
    patch.longitude = lon;
  }

  if (imageUrl !== undefined) {
    if (imageUrl === null) {
      patch.imageUrl = null;
    } else {
      const trimmed = typeof imageUrl === "string" ? imageUrl.trim() : "";
      patch.imageUrl = trimmed.length > 0 ? trimmed : null;
    }
  }

  if (Object.keys(patch).length === 0) {
    throw createHttpError(400, "No updatable fields provided.");
  }

  return patch;
}

function serializeKeyPoint(kp) {
  return {
    id: kp._id,
    name: kp.name,
    description: kp.description,
    latitude: kp.latitude,
    longitude: kp.longitude,
    imageUrl: kp.imageUrl,
    createdAt: kp.createdAt,
    updatedAt: kp.updatedAt
  };
}

async function updateKeyPoint(authorId, tourId, keyPointId, input) {
  if (!isValidObjectId(keyPointId)) {
    throw createHttpError(400, "Invalid key point id.");
  }

  const patch = validateKeyPointPatch(input);
  const tour = await getOwnedTour(authorId, tourId);

  const keyPoint = tour.keyPoints.id(keyPointId);
  if (!keyPoint) {
    throw createHttpError(404, "Key point not found.");
  }

  Object.assign(keyPoint, patch);
  await tour.save();

  return serializeKeyPoint(keyPoint);
}

async function deleteKeyPoint(authorId, tourId, keyPointId) {
  if (!isValidObjectId(keyPointId)) {
    throw createHttpError(400, "Invalid key point id.");
  }

  const tour = await getOwnedTour(authorId, tourId);

  const keyPoint = tour.keyPoints.id(keyPointId);
  if (!keyPoint) {
    throw createHttpError(404, "Key point not found.");
  }

  keyPoint.deleteOne();
  await tour.save();
}

module.exports = {
  createTour,
  listMyTours,
  getTourById,
  addKeyPoint,
  listKeyPoints,
  updateKeyPoint,
  deleteKeyPoint
};
