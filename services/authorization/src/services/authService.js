const userRepository = require("../repositories/userRepository");
const hashUtils = require("../utils/hash");
const tokenUtils = require("../utils/token");

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;

  return error;
}

function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    is_blocked: user.is_blocked,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function normalizeUsername(username) {
  return username.trim();
}

function normalizeRole(role) {
  return role.trim().toLowerCase();
}

function validateCredentials({ username, email, password, role }, mode) {
  const trimmedEmail = typeof email === "string" ? normalizeEmail(email) : "";
  const trimmedPassword = typeof password === "string" ? password.trim() : "";
  const trimmedUsername = typeof username === "string" ? normalizeUsername(username) : "";
  const normalizedRole = typeof role === "string" ? normalizeRole(role) : "";

  if (mode === "register") {
    if (!trimmedUsername || !trimmedEmail || !trimmedPassword || !normalizedRole) {
      throw createHttpError(400, "Username, email, password, and role are required.");
    }
  }

  if (mode === "login") {
    if (!trimmedEmail || !trimmedPassword) {
      throw createHttpError(400, "Email and password are required.");
    }
  }

  return {
    username: trimmedUsername,
    email: trimmedEmail,
    password: trimmedPassword,
    role: normalizedRole
  };
}

function createAuthService(dependencies = {}) {
  const repository = dependencies.userRepository || userRepository;
  const hashPassword = dependencies.hashPassword || hashUtils.hashPassword;
  const comparePassword = dependencies.comparePassword || hashUtils.comparePassword;
  const generateToken = dependencies.generateToken || tokenUtils.generateToken;

  return {
    async registerUser(payload) {
      const { username, email, password, role } = validateCredentials(payload, "register");

      if (!["guide", "tourist"].includes(role)) {
        throw createHttpError(400, "Role must be guide or tourist.");
      }

      const existingUserByUsername = await repository.findByUsername(username);
      if (existingUserByUsername) {
        throw createHttpError(409, "Username is already in use.");
      }

      const existingUserByEmail = await repository.findByEmail(email);
      if (existingUserByEmail) {
        throw createHttpError(409, "Email is already in use.");
      }

      const passwordHash = await hashPassword(password);
      const createdUser = await repository.createUser({
        username,
        email,
        passwordHash,
        role
      });

      return sanitizeUser(createdUser);
    },

    async loginUser(payload) {
      const { email, password } = validateCredentials(payload, "login");
      const user = await repository.findByEmail(email);

      if (!user) {
        throw createHttpError(401, "Invalid email or password.");
      }

      const passwordMatches = await comparePassword(password, user.password_hash);

      if (!passwordMatches) {
        throw createHttpError(401, "Invalid email or password.");
      }

      if (user.is_blocked) {
        throw createHttpError(403, "Blocked users cannot log in.");
      }

      const token = generateToken({
        sub: user.id,
        email: user.email,
        role: user.role
      });

      return {
        token,
        user: sanitizeUser(user)
      };
    },

    async listUsers() {
      return repository.listAllSafeUsers();
    }
  };
}

module.exports = {
  createAuthService
};
