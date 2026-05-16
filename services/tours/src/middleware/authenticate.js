const { verifyToken } = require("../utils/token");

function authenticate(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authorization token is required."
    });
  }

  const token = authorizationHeader.slice("Bearer ".length);

  try {
    req.user = verifyToken(token);
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token."
    });
  }
}

module.exports = authenticate;
