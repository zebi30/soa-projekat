const express = require("express");

const tourController = require("../controllers/tourController");
const keyPointController = require("../controllers/keyPointController");
const authenticate = require("../middleware/authenticate");
const requireGuide = require("../middleware/requireGuide");

const router = express.Router();

router.post("/", authenticate, requireGuide, tourController.createTour);
router.get("/mine", authenticate, requireGuide, tourController.getMyTours);
router.get("/:id", authenticate, requireGuide, tourController.getTourById);

router.post("/:id/keypoints", authenticate, requireGuide, keyPointController.addKeyPoint);
router.get("/:id/keypoints", authenticate, requireGuide, keyPointController.listKeyPoints);

module.exports = router;
