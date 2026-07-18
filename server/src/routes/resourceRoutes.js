const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer"); // Import the working upload middleware
const { uploadResource } = require("../controllers/resourceController"); // Adjust path if needed
// const { protect } = require("../middleware/authMiddleware"); // Uncomment if you are enforcing user sessions

// Define the API endpoint route correctly
router.post("/upload", upload.single("file"), uploadResource);

// 2. Change the path to '/upload' for clarity
// 3. Add 'upload.single('file')' - This is the "bridge" that handles the PDF
router.post(
  "/upload",
  auth, // 1. Authenticate user string validation
  upload.single("file"), // 2. Parse file stream
  resourceController.uploadResource,
);
// routes/resource.js

// Add this alongside your existing GET and POST routes
router.post("/stats/:id", resourceController.trackDownloadStat);

router.get("/", resourceController.getAllResources);
router.delete("/:id", auth, resourceController.deleteResource);
router.patch("/stats/:id", auth, resourceController.incrementStats);
router.get("/download/:id", resourceController.redirectToResource);

module.exports = router;
