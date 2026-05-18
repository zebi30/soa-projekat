const express = require("express");

const tourController = require("../controllers/tourController");
const keyPointController = require("../controllers/keyPointController");
const reviewController = require("../controllers/reviewController");
const authenticate = require("../middleware/authenticate");
const requireGuide = require("../middleware/requireGuide");
const requireTourist = require("../middleware/requireTourist");

const router = express.Router();

router.post("/", authenticate, requireGuide, tourController.createTour);
router.get("/mine", authenticate, requireGuide, tourController.getMyTours);
router.get("/:id", authenticate, requireGuide, tourController.getTourById);

router.post("/:id/keypoints", authenticate, requireGuide, keyPointController.addKeyPoint);
router.get("/:id/keypoints", authenticate, requireGuide, keyPointController.listKeyPoints);
router.put("/:id/keypoints/:keyPointId", authenticate, requireGuide, keyPointController.updateKeyPoint);
router.delete("/:id/keypoints/:keyPointId", authenticate, requireGuide, keyPointController.deleteKeyPoint);

router.post("/:id/reviews", authenticate, requireTourist, reviewController.createReview);
router.get("/:id/reviews", authenticate, reviewController.getReviews);

module.exports = router;
