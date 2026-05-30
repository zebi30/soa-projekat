const express = require("express");

const internalController = require("../controllers/internalController");
const requireInternalKey = require("../middleware/requireInternalKey");

const router = express.Router();

router.get("/tours/:id", requireInternalKey, internalController.getFullTour);

module.exports = router;
