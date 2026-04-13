const express = require("express");

const authController = require("../controllers/authController");
const authenticate = require("../middleware/authenticate");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me/profile", authenticate, authController.getMyProfile);
router.get("/users/:id", authController.getUserById);
router.get("/users", authenticate, requireAdmin, authController.getUsers);
router.patch("/users/:id/block", authenticate, requireAdmin, authController.blockUser);

module.exports = router;
