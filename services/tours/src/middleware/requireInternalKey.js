const env = require("../config/env");

function requireInternalKey(req, res, next) {
  const providedKey = req.headers["x-internal-api-key"];

  if (!providedKey || providedKey !== env.INTERNAL_API_KEY) {
    return res.status(401).json({
      message: "Invalid internal API key."
    });
  }

  next();
}

module.exports = requireInternalKey;
