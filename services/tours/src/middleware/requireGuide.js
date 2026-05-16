function requireGuide(req, res, next) {
  if (!req.user || req.user.role !== "guide") {
    return res.status(403).json({
      message: "Guide access required."
    });
  }

  next();
}

module.exports = requireGuide;
