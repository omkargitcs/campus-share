const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  try {
    // 1. Get token from header
    const authHeader =
      req.headers["authorization"] ||
      req.headers["Authorization"] ||
      req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access Denied: No token provided or invalid format",
      });
    }

    // 2. Extract the actual token string
    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
      return res.status(401).json({ message: "Access Denied: Empty token" });
    }
    if (!process.env.JWT_SECRET) {
      console.error("JWT Verification Error: JWT_SECRET is not configured");
      return res.status(500).json({ message: "Authentication is not configured on the server" });
    }

    // 3. Verify token
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Attach user info to request (this is critical for CampusShare uploads)
    req.user = verified;
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = auth;
