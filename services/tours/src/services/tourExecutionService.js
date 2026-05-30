const mongoose = require("mongoose");
const http = require("http");

const Tour = require("../models/Tour");
const TourExecution = require("../models/TourExecution");

const PROXIMITY_RADIUS_KM = 0.05; // 50 metres

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function checkPurchased(touristAuthorization, tourId) {
  const purchaseUrl = process.env.PURCHASE_SERVICE_URL;
  if (!purchaseUrl) return; // purchase not configured yet — skip check

  await new Promise((resolve, reject) => {
    const url = new URL(`/api/purchases/${tourId}/tour`, purchaseUrl);
    const req = http.request(
      { hostname: url.hostname, port: url.port, path: url.pathname, method: "GET",
        headers: { Authorization: touristAuthorization } },
      (res) => {
        if (res.statusCode === 200) return resolve();
        reject(createHttpError(403, "You must purchase this tour before starting it."));
      }
    );
    req.on("error", () => reject(createHttpError(502, "Could not verify purchase.")));
    req.end();
  });
}

async function startExecution(touristId, touristAuthorization, tourId, { latitude, longitude }) {
  if (!isValidObjectId(tourId)) throw createHttpError(400, "Invalid tour id.");

  const tour = await Tour.findById(tourId);
  if (!tour) throw createHttpError(404, "Tour not found.");

  if (tour.status !== "published" && tour.status !== "archived") {
    throw createHttpError(400, "Only published or archived tours can be started.");
  }

  await checkPurchased(touristAuthorization, tourId);

  const existing = await TourExecution.findOne({ touristId, tourId, status: "active" });
  if (existing) throw createHttpError(409, "You already have an active session for this tour.");

  const now = new Date();
  const execution = await TourExecution.create({
    tourId,
    touristId: String(touristId),
    status: "active",
    startTime: now,
    endTime: null,
    startLocation: { latitude, longitude },
    completedKeyPoints: [],
    lastActivity: now
  });

  return execution.toJSON();
}

async function completeExecution(touristId, executionId) {
  if (!isValidObjectId(executionId)) throw createHttpError(400, "Invalid execution id.");

  const execution = await TourExecution.findById(executionId);
  if (!execution) throw createHttpError(404, "Tour execution not found.");
  if (String(execution.touristId) !== String(touristId)) throw createHttpError(403, "Access denied.");
  if (execution.status !== "active") throw createHttpError(400, "Only active executions can be completed.");

  const now = new Date();
  execution.status = "completed";
  execution.endTime = now;
  execution.lastActivity = now;
  await execution.save();

  return execution.toJSON();
}

async function abandonExecution(touristId, executionId) {
  if (!isValidObjectId(executionId)) throw createHttpError(400, "Invalid execution id.");

  const execution = await TourExecution.findById(executionId);
  if (!execution) throw createHttpError(404, "Tour execution not found.");
  if (String(execution.touristId) !== String(touristId)) throw createHttpError(403, "Access denied.");
  if (execution.status !== "active") throw createHttpError(400, "Only active executions can be abandoned.");

  const now = new Date();
  execution.status = "abandoned";
  execution.endTime = now;
  execution.lastActivity = now;
  await execution.save();

  return execution.toJSON();
}

async function checkPosition(touristId, executionId, { latitude, longitude }) {
  if (!isValidObjectId(executionId)) throw createHttpError(400, "Invalid execution id.");

  const execution = await TourExecution.findById(executionId);
  if (!execution) throw createHttpError(404, "Tour execution not found.");
  if (String(execution.touristId) !== String(touristId)) throw createHttpError(403, "Access denied.");
  if (execution.status !== "active") throw createHttpError(400, "Tour execution is not active.");

  const tour = await Tour.findById(execution.tourId);
  if (!tour) throw createHttpError(404, "Tour not found.");

  const alreadyCompleted = new Set(execution.completedKeyPoints.map((c) => String(c.keyPointId)));
  const now = new Date();
  const newlyCompleted = [];

  for (const kp of tour.keyPoints) {
    const kpId = String(kp._id);
    if (alreadyCompleted.has(kpId)) continue;

    const distance = haversineKm(latitude, longitude, kp.latitude, kp.longitude);
    if (distance <= PROXIMITY_RADIUS_KM) {
      execution.completedKeyPoints.push({ keyPointId: kpId, completedAt: now });
      newlyCompleted.push({ keyPointId: kpId, name: kp.name, completedAt: now });
    }
  }

  execution.lastActivity = now;
  await execution.save();

  return { execution: execution.toJSON(), newlyCompletedKeyPoints: newlyCompleted };
}

async function getActiveExecution(touristId) {
  const execution = await TourExecution.findOne({ touristId, status: "active" });
  return execution ? execution.toJSON() : null;
}

module.exports = {
  startExecution,
  completeExecution,
  abandonExecution,
  checkPosition,
  getActiveExecution
};
