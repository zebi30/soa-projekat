const express = require("express");

const tourExecutionController = require("../controllers/tourExecutionController");
const authenticate = require("../middleware/authenticate");
const requireTourist = require("../middleware/requireTourist");

const router = express.Router();

router.get("/active", authenticate, requireTourist, tourExecutionController.getActiveExecution);
router.patch("/:id/complete", authenticate, requireTourist, tourExecutionController.completeExecution);
router.patch("/:id/abandon", authenticate, requireTourist, tourExecutionController.abandonExecution);
router.post("/:id/check-position", authenticate, requireTourist, tourExecutionController.checkPosition);

module.exports = router;
