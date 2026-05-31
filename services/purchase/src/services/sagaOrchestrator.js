const TourPurchaseToken = require("../models/TourPurchaseToken");
const toursClient = require("./toursClient");

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function requirePurchasableTour(tourId) {
  const tour = await toursClient.fetchTourById(tourId);

  if (!tour) {
    throw createHttpError(404, "Tour not found.");
  }

  if (tour.status !== "published") {
    throw createHttpError(409, "Only published tours can be purchased.");
  }

  return tour;
}

// Orchestrated checkout saga for purchases.
// Executes validation and token creation with simple compensation on failure.
async function runCheckoutSaga(touristId, items) {
  if (!items || items.length === 0) {
    throw createHttpError(400, "Cart is empty.");
  }

  // validate each tour can be purchased
  for (const item of items) {
    await requirePurchasableTour(item.tourId);
  }

  const createdTokens = [];

  try {
    for (const item of items) {
      try {
        const token = await TourPurchaseToken.create({
          touristId,
          tourId: item.tourId,
          tourName: item.tourName,
          price: item.price,
          purchasedAt: new Date()
        });
        createdTokens.push(token.toJSON());
      } catch (error) {
        if (error && error.code === 11000) {
          throw createHttpError(409, `You have already purchased the tour "${item.tourName}".`);
        }
        throw error;
      }
    }

    return {
      purchasedCount: createdTokens.length,
      tokens: createdTokens
    };
  } catch (err) {
    // compensation: remove any tokens created in this run
    if (createdTokens.length > 0) {
      const ids = createdTokens.map((t) => t._id).filter(Boolean);
      if (ids.length > 0) {
        await TourPurchaseToken.deleteMany({ _id: { $in: ids } }).catch(() => {});
      }
    }
    throw err;
  }
}

module.exports = { runCheckoutSaga };
