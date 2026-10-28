const jwt = require("jsonwebtoken");

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
    algorithm: "HS256",
  });

module.exports = { signToken };
