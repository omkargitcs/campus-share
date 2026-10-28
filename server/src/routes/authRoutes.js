const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimiters");

// Final URLs: /api/auth/register and /api/auth/login
router.post("/register", registerLimiter, authController.register);
router.post("/login", loginLimiter, authController.login);

module.exports = router;
