const asyncHandler = require("../utils/asyncHandler");
const purchaseService = require("../services/purchaseService");

const checkout = asyncHandler(async (req, res) => {
  const result = await purchaseService.checkout(req.user.sub);

  res.status(201).json({
    message: "Checkout completed successfully.",
    purchasedCount: result.purchasedCount,
    tokens: result.tokens
  });
});

const listMyPurchases = asyncHandler(async (req, res) => {
  const purchases = await purchaseService.listMyPurchases(req.user.sub);

  res.status(200).json({ purchases });
});

const getPurchasedTourDetails = asyncHandler(async (req, res) => {
  const tour = await purchaseService.getPurchasedTourDetails(req.user.sub, req.params.tourId);

  res.status(200).json({ tour });
});

module.exports = {
  checkout,
  listMyPurchases,
  getPurchasedTourDetails
};
