const TouristPosition = require("../models/TouristPosition");

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validatePositionInput({ latitude, longitude }) {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw createHttpError(400, "Latitude must be a number between -90 and 90.");
  }

  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw createHttpError(400, "Longitude must be a number between -180 and 180.");
  }

  return { latitude: lat, longitude: lon };
}

async function getPosition(touristId) {
  const position = await TouristPosition.findOne({ touristId: String(touristId) });
  return position ? position.toJSON() : null;
}

async function setPosition(touristId, input) {
  const data = validatePositionInput(input);

  const position = await TouristPosition.findOneAndUpdate(
    { touristId: String(touristId) },
    { $set: { ...data, touristId: String(touristId) } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return position.toJSON();
}

module.exports = {
  getPosition,
  setPosition
};
