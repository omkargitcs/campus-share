const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// 1. Double check your Cloudinary environment variables match your dashboard credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Ensure resource_type is set to 'auto' or 'raw' so Cloudinary accepts PDFs!
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "campus_share_resources",
    resource_type: "auto", // 👈 CRITICAL: If omitted, Cloudinary rejects PDFs thinking they are images
    allowed_formats: ["pdf", "doc", "docx", "png", "jpg", "jpeg"],
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
