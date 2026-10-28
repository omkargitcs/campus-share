const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const { passwordLimiter } = require("../middleware/rateLimiters");

router.use(auth);

router.get("/profile", userController.getProfile);
router.patch("/password", passwordLimiter, userController.changePassword);

// Admin only
router.get("/", requireRole("ADMIN"), userController.searchUsers);
router.patch("/:id/role", requireRole("ADMIN"), userController.setUserRole);

module.exports = router;
