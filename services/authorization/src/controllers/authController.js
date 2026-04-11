const asyncHandler = require("../utils/asyncHandler");
const { createAuthService } = require("../services/authService");

const authService = createAuthService();

const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);

  res.status(201).json({
    message: "User registered successfully.",
    user
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);

  res.status(200).json({
    message: "Login successful.",
    token: result.token,
    user: result.user
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  res.status(200).json({ user });
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await authService.listUsers();

  res.status(200).json({
    users
  });
});

module.exports = {
  register,
  login,
  getUserById,
  getUsers
};
