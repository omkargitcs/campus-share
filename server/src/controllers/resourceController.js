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
        // ➔ Dynamically tell Cloudinary if it's an image or a raw document (like a PDF)
        const isPdf = req.file.mimetype === "application/pdf";

        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "campus_share_resources",
            resource_type: isPdf ? "raw" : "auto", // 👈 "raw" forces Cloudinary to treat PDFs cleanly without treating them as images!
          },
          (error, result) => {
            if (error) {
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

exports.getAllResources = async (req, res) => {
  try {
    const resources = await prisma.resource.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(resources);
  } catch (error) {
    console.error("GET_ALL_RESOURCES_ERROR:", error);
    res.status(500).json({ message: "Failed to fetch resources" });
  }
};

exports.deleteResource = async (req, res) => {
  try {
    const { id } = req.params;

    // Optional: Add a check here to ensure req.user.id === resource.ownerId
    await prisma.resource.delete({
      where: { id: parseInt(id) || id }, // adjusts if your ID is an integer or string UUID
    });

    res.status(200).json({ message: "Resource deleted successfully" });
  } catch (error) {
    console.error("DELETE_RESOURCE_ERROR:", error);
    res.status(500).json({ message: "Failed to delete resource" });
  }
};

// 3. Increment download/view stats
exports.incrementStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 👈 Captures "views" or "downloads" from frontend request body

    // Fallback protection: ensure we only alter allowed stats columns
    const fieldToIncrement = type === "downloads" ? "downloads" : "views";

    const updatedResource = await prisma.resource.update({
      where: { id: parseInt(id) || id },
      data: {
        [fieldToIncrement]: { increment: 1 }, // 👈 Dynamically increments either column!
      },
    });

    res.status(200).json(updatedResource);
  } catch (error) {
    console.error("INCREMENT_STATS_ERROR:", error);
    res.status(500).json({ message: "Failed to update statistics" });
  }
};
