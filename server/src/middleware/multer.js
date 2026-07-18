const multer = require("multer");

// Configure storage in memory so buffers can be easily forwarded to AWS S3
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file limit
  },
});

module.exports = upload;
