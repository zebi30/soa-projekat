const env = require("./../config/env");

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function fetchTourById(tourId) {
  let response;

  try {
    response = await fetch(`${env.TOURS_INTERNAL_URL}/internal/tours/${tourId}`, {
      method: "GET",
      headers: {
        "X-Internal-Api-Key": env.INTERNAL_API_KEY
      }
    });
  } catch (_error) {
    throw createHttpError(502, "Tours service is unavailable.");
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw createHttpError(502, "Failed to fetch tour from tours service.");
  }

  const body = await response.json();
  return body.tour;
}

module.exports = {
  fetchTourById
};
