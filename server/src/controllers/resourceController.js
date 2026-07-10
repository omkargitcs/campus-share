const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary explicitly with your environment strings
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.uploadResource = async (req, res) => {
  try {
    const { title, description, category, price } = req.body;

    if (!title || !category) {
      return res
        .status(400)
        .json({ message: "Title and Category are required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file" });
    }

    // Upload the memory buffer stream directly to Cloudinary with strict error logging
    const uploadFromBuffer = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "campus_share_resources",
            resource_type: "auto",
          },
          (error, result) => {
            if (error) {
              // ➔ This will print the exact reason Cloudinary rejected it to your server logs!
              console.error("DETAILED_CLOUDINARY_STREAM_ERROR:", error);
              return reject(error);
            }
            resolve(result);
          },
        );

        uploadStream.end(fileBuffer);
      });
    };

    const cloudinaryResult = await uploadFromBuffer(req.file.buffer);

    // Fallback extraction matching secure url properties securely
    const savedFilePath = cloudinaryResult?.secure_url || cloudinaryResult?.url;

    if (!savedFilePath) {
      return res.status(400).json({
        message: "File uploaded but cloud storage path could not be parsed.",
      });
    }

    const newResource = await prisma.resource.create({
      data: {
        title,
        description,
        category,
        price: parseFloat(price) || 0,
        fileUrl: savedFilePath,
        ownerId: req.user.id,
      },
    });

    res.status(201).json({
      message: "Resource uploaded successfully!",
      resource: newResource,
    });
  } catch (error) {
    console.error("CLOUDINARY_PRISMA_UPLOAD_ERROR:", error);
    res.status(500).json({
      message: "Internal server error during upload",
      error: error.message,
    });
  }
};
