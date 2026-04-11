const express = require("express");

const authController = require("../controllers/authController");
const authenticate = require("../middleware/authenticate");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/users", authenticate, requireAdmin, authController.getUsers);

module.exports = router;
