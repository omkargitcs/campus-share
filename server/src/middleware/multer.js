const multer = require("multer");

// Memory storage so the buffer can be checked and forwarded to S3.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 }, // 10MB, one file
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(Object.assign(new Error("Only PDF files are allowed"), { status: 400, expose: true }));
    }
    cb(null, true);
  },
});

module.exports = upload;
