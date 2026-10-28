const jwt = require("jsonwebtoken");
const prisma = require("../db");

const getToken = (req) => {
  const header = req.headers["authorization"];
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
};

// Verifies the JWT, then loads the user's CURRENT role from the database so that
// promotions, demotions and deleted accounts take effect immediately.
// Tokens issued before the last password change are rejected too.
const auth = async (req, res, next) => {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ message: "Access Denied: No token provided" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    const user = await prisma.user.findUnique({
      where: { id: String(payload.id) },
      select: { id: true, email: true, role: true, passwordChangedAt: true },
    });
    if (!user) {
      return res.status(401).json({ message: "Account no longer exists" });
    }
    if (user.passwordChangedAt && payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    if (["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(error.name)) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    console.error("AUTH_MIDDLEWARE_ERROR:", error);
    res.status(500).json({ message: "Authentication check failed" });
  }
};

module.exports = auth;
