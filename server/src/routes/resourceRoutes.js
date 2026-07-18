const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const {
  uploadResource,
  trackDownloadStat,
  getAllResources,
  deleteResource,
  incrementStats,
  redirectToResource,
} = require("../controllers/resourceController");

// Import the auth middleware to handle user session/token validation
const auth = require("../middleware/auth");

// --- POST Routes ---
// Handles the PDF/document upload stream and saves it to the database
router.post("/upload", auth, upload.single("file"), uploadResource);

// Track download statistics for a specific resource
router.post("/stats/:id", trackDownloadStat);

// --- GET Routes ---
// Fetch all campus resources
router.get("/", getAllResources);

// Securely redirect to the raw resource URL (e.g., AWS S3 bucket path)
router.get("/download/:id", redirectToResource);

// --- PATCH / UPDATE Routes ---
// Increment view or download interaction metrics
router.patch("/stats/:id", auth, incrementStats);

// --- DELETE Routes ---
// Securely remove a resource from the platform
router.delete("/:id", auth, deleteResource);

module.exports = router;
