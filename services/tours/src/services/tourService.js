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

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function haversineKm(first, second) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(second.latitude - first.latitude);
  const dLon = toRadians(second.longitude - first.longitude);
  const lat1 = toRadians(first.latitude);
  const lat2 = toRadians(second.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateLengthKm(keyPoints) {
  if (!Array.isArray(keyPoints) || keyPoints.length < 2) {
    return 0;
  }

  let length = 0;
  for (let i = 1; i < keyPoints.length; i += 1) {
    length += haversineKm(keyPoints[i - 1], keyPoints[i]);
  }

  return Math.round(length * 100) / 100;
}

function recalculateTourLength(tour) {
  tour.lengthKm = calculateLengthKm(tour.keyPoints);
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

function validateTransportTimeInput({ transport, minutes }) {
  const normalizedTransport = typeof transport === "string" ? transport.trim().toLowerCase() : "";
  if (!["walking", "bicycle", "car"].includes(normalizedTransport)) {
    throw createHttpError(400, "Transport must be one of: walking, bicycle, car.");
  }

  const normalizedMinutes = Number(minutes);
  if (!Number.isInteger(normalizedMinutes) || normalizedMinutes < 1) {
    throw createHttpError(400, "Minutes must be a positive integer.");
  }

  return {
    transport: normalizedTransport,
    minutes: normalizedMinutes
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
  recalculateTourLength(tour);
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
  recalculateTourLength(tour);
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
  recalculateTourLength(tour);
  await tour.save();
}

function serializeTransportTime(transportTime) {
  return {
    id: transportTime._id,
    transport: transportTime.transport,
    minutes: transportTime.minutes,
    createdAt: transportTime.createdAt,
    updatedAt: transportTime.updatedAt
  };
}

async function addTransportTime(authorId, tourId, input) {
  const data = validateTransportTimeInput(input);
  const tour = await getOwnedTour(authorId, tourId);

  tour.transportTimes.push(data);
  await tour.save();

  return serializeTransportTime(tour.transportTimes[tour.transportTimes.length - 1]);
}

async function listTransportTimes(authorId, tourId) {
  const tour = await getOwnedTour(authorId, tourId);
  return tour.toJSON().transportTimes;
}

function validatePublishRequirements(tour) {
  if (tour.status !== "draft") {
    throw createHttpError(409, "Only draft tours can be published.");
  }

  if (!tour.name || !tour.description || !tour.difficulty || !Array.isArray(tour.tags) || tour.tags.length === 0) {
    throw createHttpError(400, "Tour must have name, description, difficulty, and at least one tag.");
  }

  if (!Array.isArray(tour.keyPoints) || tour.keyPoints.length < 2) {
    throw createHttpError(400, "Tour must have at least two key points.");
  }

  if (!Array.isArray(tour.transportTimes) || tour.transportTimes.length < 1) {
    throw createHttpError(400, "Tour must have at least one transport time.");
  }
}

async function publishTour(authorId, tourId) {
  const tour = await getOwnedTour(authorId, tourId);
  validatePublishRequirements(tour);

  tour.status = "published";
  tour.publishedAt = new Date();
  await tour.save();

  return tour.toJSON();
}

async function archiveTour(authorId, tourId) {
  const tour = await getOwnedTour(authorId, tourId);

  if (tour.status !== "published") {
    throw createHttpError(409, "Only published tours can be archived.");
  }

  tour.status = "archived";
  tour.archivedAt = new Date();
  await tour.save();

  return tour.toJSON();
}

async function activateTour(authorId, tourId) {
  const tour = await getOwnedTour(authorId, tourId);

  if (tour.status !== "archived") {
    throw createHttpError(409, "Only archived tours can be activated.");
  }

  tour.status = "published";
  await tour.save();

  return tour.toJSON();
}

function toPublishedTourPreview(tour) {
  const serialized = tour.toJSON ? tour.toJSON() : tour;
  const firstKeyPoint = Array.isArray(serialized.keyPoints) && serialized.keyPoints.length > 0
    ? serialized.keyPoints[0]
    : null;

  return {
    id: serialized.id,
    name: serialized.name,
    description: serialized.description,
    difficulty: serialized.difficulty,
    tags: serialized.tags,
    status: serialized.status,
    price: serialized.price,
    lengthKm: serialized.lengthKm,
    transportTimes: serialized.transportTimes,
    firstKeyPoint,
    publishedAt: serialized.publishedAt,
    createdAt: serialized.createdAt,
    updatedAt: serialized.updatedAt
  };
}

async function listPublishedTours() {
  const tours = await Tour.find({ status: "published" }).sort({ publishedAt: -1, createdAt: -1 });
  return tours.map(toPublishedTourPreview);
}

async function getFullTourById(tourId) {
  if (!isValidObjectId(tourId)) {
    return null;
  }

  const tour = await Tour.findById(tourId);
  if (!tour) {
    return null;
  }

  return tour.toJSON();
}

module.exports = {
  createTour,
  listMyTours,
  getTourById,
  addKeyPoint,
  listKeyPoints,
  updateKeyPoint,
  deleteKeyPoint,
  addTransportTime,
  listTransportTimes,
  publishTour,
  archiveTour,
  activateTour,
  listPublishedTours,
  getFullTourById
};
