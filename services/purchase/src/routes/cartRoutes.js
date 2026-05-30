const express = require("express");

const cartController = require("../controllers/cartController");
const purchaseController = require("../controllers/purchaseController");
const authenticate = require("../middleware/authenticate");
const requireTourist = require("../middleware/requireTourist");

const router = express.Router();

router.get("/", authenticate, requireTourist, cartController.getCart);
router.post("/items", authenticate, requireTourist, cartController.addToCart);
router.delete("/items/:tourId", authenticate, requireTourist, cartController.removeFromCart);
router.post("/checkout", authenticate, requireTourist, purchaseController.checkout);

module.exports = router;
