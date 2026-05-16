const jwt = require("jsonwebtoken");

const env = require("../config/env");

function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

module.exports = {
  verifyToken
};
