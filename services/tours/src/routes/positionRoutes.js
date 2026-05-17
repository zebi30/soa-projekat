const express = require("express");

const positionController = require("../controllers/positionController");
const authenticate = require("../middleware/authenticate");
const requireTourist = require("../middleware/requireTourist");

const router = express.Router();

router.get("/me", authenticate, requireTourist, positionController.getMyPosition);
router.put("/me", authenticate, requireTourist, positionController.setMyPosition);

module.exports = router;
