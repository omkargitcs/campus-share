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

    const uploadFromBuffer = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        // Detect if it's a PDF so we route it cleanly
        const isPdf =
          req.file.mimetype === "application/pdf" ||
          req.file.originalname.endsWith(".pdf");

        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "campus_share_resources",
            resource_type: isPdf ? "raw" : "auto",
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

    // CRITICAL: Trust Cloudinary's secure_url directly—it automatically swaps /image/ to /raw/ for us!
    const savedFilePath = cloudinaryResult?.secure_url;

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
        fileUrl: savedFilePath, // This will now perfectly store the accurate link format
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

    // 1. Double check if this card exists before deleting
    const resource = await prisma.resource.findUnique({
      where: { id: id.toString() },
    });

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // 2. Clear out the resource record directly
    await prisma.resource.delete({
      where: { id: id.toString() },
    });

    res.status(200).json({ message: "Resource deleted successfully" });
  } catch (error) {
    console.error("DELETE_RESOURCE_ERROR:", error);

    // Check if it's a Prisma relational dependency restriction error (P2003)
    if (error.code === "P2003") {
      return res.status(400).json({
        message:
          "Cannot delete this resource because other tracking stats or tables depend on it.",
      });
    }

    res.status(500).json({
      message: "Failed to delete resource",
      error: error.message,
    });
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
