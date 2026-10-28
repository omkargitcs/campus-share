const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const auth = require("../middleware/auth");
const { uploadLimiter } = require("../middleware/rateLimiters");
const {
  uploadResource,
  getAllResources,
  getAccessUrl,
  deleteResource,
  updateResourceStatus,
  addBookmark,
  removeBookmark,
} = require("../controllers/resourceController");

// Every resource route needs a logged-in user.
router.use(auth);

router.get("/", getAllResources);
router.get("/:id/access", getAccessUrl); // short-lived signed link (also counts the open)
router.post("/upload", uploadLimiter, upload.single("file"), uploadResource);
router.put("/:id/bookmark", addBookmark);
router.delete("/:id/bookmark", removeBookmark);
router.patch("/:id/status", updateResourceStatus);
router.delete("/:id", deleteResource);

module.exports = router;
