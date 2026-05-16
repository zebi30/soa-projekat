function requireTourist(req, res, next) {
  if (!req.user || req.user.role !== "tourist") {
    return res.status(403).json({
      message: "Tourist access required."
    });
  }

  next();
}

module.exports = requireTourist;
