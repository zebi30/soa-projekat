const express = require("express");

const purchaseController = require("../controllers/purchaseController");
const authenticate = require("../middleware/authenticate");
const requireTourist = require("../middleware/requireTourist");

const router = express.Router();

router.get("/", authenticate, requireTourist, purchaseController.listMyPurchases);
router.get("/:tourId/tour", authenticate, requireTourist, purchaseController.getPurchasedTourDetails);

module.exports = router;
