const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// Initialize the AWS S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
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

    // Clean the file name (e.g., "React Notes.pdf" -> "React_Notes")
    const originalNameWithoutExt = req.file.originalname
      .split(".")
      .slice(0, -1)
      .join(".")
      .replace(/[^a-zA-Z0-9-_]/g, "_");

    // Enforce uniform unique filename structure inside the bucket
    const uniqueFileName = `resources/${Date.now()}_${originalNameWithoutExt}.pdf`;

    // Configure the S3 upload payload parameters
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: uniqueFileName,
      Body: req.file.buffer, // Direct buffer access from Multer memory storage
      ContentType: "application/pdf", // Ensures the browser renders it smoothly instead of forcing a download
    };

    // Execute the upload command to your bucket
    await s3Client.send(new PutObjectCommand(uploadParams));

    // Construct the direct public URL path structure for S3
    const savedFilePath = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;

    // Create the resource record in PostgreSQL using Prisma
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
      message: "Resource uploaded successfully to S3!",
      resource: newResource,
    });
  } catch (error) {
    console.error("AWS_S3_PRISMA_UPLOAD_ERROR:", error);
    res.status(500).json({
      message: "Internal server error during S3 upload",
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

    const resource = await prisma.resource.findUnique({
      where: { id: id.toString() },
    });

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    await prisma.resource.delete({
      where: { id: id.toString() },
    });

    res.status(200).json({ message: "Resource deleted successfully" });
  } catch (error) {
    console.error("DELETE_RESOURCE_ERROR:", error);

    if (error.code === "P2003") {
      return res.status(400).json({
        message:
          "Cannot delete this resource because other tracking stats depend on it.",
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

    const updatedResource = await prisma.resource.update({
      where: { id: id.toString() },
      data: {
        downloads: { increment: 1 },
      },
    });

    if (!updatedResource || !updatedResource.fileUrl) {
      return res.status(404).send("Resource file not found.");
    }

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
