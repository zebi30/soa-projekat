const asyncHandler = require("../utils/asyncHandler");
const purchaseService = require("../services/purchaseService");

const addToCart = asyncHandler(async (req, res) => {
  const cart = await purchaseService.addToCart(req.user.sub, req.body.tourId);

  res.status(201).json({
    message: "Tour added to cart.",
    cart
  });
});

const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await purchaseService.removeFromCart(req.user.sub, req.params.tourId);

  res.status(200).json({
    message: "Tour removed from cart.",
    cart
  });
});

const getCart = asyncHandler(async (req, res) => {
  const cart = await purchaseService.getCart(req.user.sub);

  res.status(200).json({ cart });
});

module.exports = {
  addToCart,
  removeFromCart,
  getCart
};
