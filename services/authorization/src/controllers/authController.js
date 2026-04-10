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

const getUsers = asyncHandler(async (req, res) => {
  const users = await authService.listUsers();

  res.status(200).json({
    users
  });
});

module.exports = {
  register,
  login,
  getUsers
};
