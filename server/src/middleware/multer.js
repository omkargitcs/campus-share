const multer = require("multer");

// Configure clean memory storage allocation for the buffer stream
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file limit
});

module.exports = upload;
