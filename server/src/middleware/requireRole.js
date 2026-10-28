// Usage: router.post('/teams', auth, requireRole('TEACHER', 'ADMIN'), handler)
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden: insufficient role" });
  }
  next();
};

module.exports = requireRole;
