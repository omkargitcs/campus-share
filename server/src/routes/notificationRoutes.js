const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { listNotifications, markOneRead, markAllRead } = require("../controllers/notificationController");

router.use(auth);

router.get("/", listNotifications);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markOneRead);

module.exports = router;
