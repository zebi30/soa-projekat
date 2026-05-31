const ShoppingCart = require("../models/ShoppingCart");
const TourPurchaseToken = require("../models/TourPurchaseToken");
const toursClient = require("./toursClient");

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function recomputeTotal(cart) {
  cart.totalPrice = cart.items.reduce((sum, item) => sum + item.price, 0);
}

async function getOrCreateCart(touristId) {
  let cart = await ShoppingCart.findOne({ touristId });
  if (!cart) {
    cart = await ShoppingCart.create({ touristId, items: [], totalPrice: 0 });
  }
  return cart;
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

async function addToCart(touristId, tourId) {
  if (typeof tourId !== "string" || tourId.trim().length === 0) {
    throw createHttpError(400, "Tour id is required.");
  }

  const normalizedTourId = tourId.trim();

  const alreadyPurchased = await TourPurchaseToken.findOne({ touristId, tourId: normalizedTourId });
  if (alreadyPurchased) {
    throw createHttpError(409, "You have already purchased this tour.");
  }

  const tour = await requirePurchasableTour(normalizedTourId);
  const cart = await getOrCreateCart(touristId);

  if (cart.items.some((item) => item.tourId === normalizedTourId)) {
    throw createHttpError(409, "Tour is already in your cart.");
  }

  cart.items.push({
    tourId: normalizedTourId,
    tourName: tour.name,
    price: tour.price
  });
  recomputeTotal(cart);
  await cart.save();

  return cart.toJSON();
}

async function removeFromCart(touristId, tourId) {
  const cart = await getOrCreateCart(touristId);

  const item = cart.items.find((current) => current.tourId === tourId);
  if (!item) {
    throw createHttpError(404, "Tour is not in your cart.");
  }

  cart.items.pull({ _id: item._id });
  recomputeTotal(cart);
  await cart.save();

  return cart.toJSON();
}

async function getCart(touristId) {
  const cart = await getOrCreateCart(touristId);
  return cart.toJSON();
}

const sagaOrchestrator = require("./sagaOrchestrator");

async function checkout(touristId) {
  const cart = await getOrCreateCart(touristId);

  // delegate sequence to orchestrator while preserving API behavior
  const result = await sagaOrchestrator.runCheckoutSaga(touristId, cart.items);

  // clear cart after successful saga
  cart.items = [];
  recomputeTotal(cart);
  await cart.save();

  return result;
}

async function listMyPurchases(touristId) {
  const tokens = await TourPurchaseToken.find({ touristId }).sort({ purchasedAt: -1 });
  return tokens.map((token) => token.toJSON());
}

async function getPurchasedTourDetails(touristId, tourId) {
  const token = await TourPurchaseToken.findOne({ touristId, tourId });
  if (!token) {
    throw createHttpError(403, "You have not purchased this tour.");
  }

  const tour = await toursClient.fetchTourById(tourId);
  if (!tour) {
    throw createHttpError(404, "Tour not found.");
  }

  return tour;
}

module.exports = {
  addToCart,
  removeFromCart,
  getCart,
  checkout,
  listMyPurchases,
  getPurchasedTourDetails
};
