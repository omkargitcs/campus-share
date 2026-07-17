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

    // Clean the actual file name they uploaded (e.g., "React Notes.pdf" -> "React_Notes")
    const originalNameWithoutExt = req.file.originalname
      .split(".")
      .slice(0, -1)
      .join(".")
      .replace(/[^a-zA-Z0-9-_]/g, "_");

    const uploadFromBuffer = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "campus_share_resources",
            resource_type: "auto", // Let Cloudinary handle the raw document parsing
            access_mode: "public", // FIX: Changed from "anonymous" to "public"
            // Keeps the clean name and appends .pdf so it opens smoothly in browser tabs
            public_id: `${originalNameWithoutExt}.pdf`,
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

exports.incrementStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    const fieldToIncrement = type === "downloads" ? "downloads" : "views";

    const updatedResource = await prisma.resource.update({
      where: { id: parseInt(id) || id },
      data: {
        [fieldToIncrement]: { increment: 1 },
      },
    });

    res.status(200).json(updatedResource);
  } catch (error) {
    console.error("INCREMENT_STATS_ERROR:", error);
    res.status(500).json({ message: "Failed to update statistics" });
  }
};

exports.redirectToResource = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Increment the download stat inside the database directly
    const updatedResource = await prisma.resource.update({
      where: { id: id.toString() },
      data: {
        downloads: { increment: 1 },
      },
    });

    if (!updatedResource || !updatedResource.fileUrl) {
      return res.status(404).send("Resource file not found.");
    }

    // 2. Redirect the browser tab directly to the secure Cloudinary URL location
    return res.redirect(updatedResource.fileUrl);
  } catch (error) {
    console.error("REDIRECT_RESOURCE_ERROR:", error);
    return res
      .status(500)
      .send("Internal server error handling document link.");
  }
};

exports.trackDownloadStat = async (req, res) => {
  const { id } = req.params;
  const { type } = req.body;

  try {
    if (type !== "downloads") {
      return res.status(400).json({ message: "Invalid stat type" });
    }

    // Increment the downloads column by 1 atomically (Handles both String and Number schemas seamlessly)
    const updatedResource = await prisma.resource.update({
      where: { id: parseInt(id) || id },
      data: {
        downloads: {
          increment: 1,
        },
      },
    });

    return res
      .status(200)
      .json({ success: true, downloads: updatedResource.downloads });
  } catch (error) {
    console.error("Failed to update stat tracking:", error);
    return res
      .status(500)
      .json({ message: "Internal server error tracking stats" });
  }
};
