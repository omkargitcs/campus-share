const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.uploadResource = async (req, res) => {
  try {
    const { title, description, category, price, fileUrl } = req.body;

    if (!title || !category) {
      return res.status(400).json({ message: "Title and Category are required" });
    }

    // NOTE: Ensure your Frontend upload call to Cloudinary uses { resource_type: "auto" }
    // This prevents the "Failed to load PDF" error you see in your screenshots.

    const newResource = await prisma.resource.create({
      data: {
        title,
        description,
        category,
        price: parseFloat(price) || 0,
        fileUrl: fileUrl || "", 
        ownerId: req.user.id, 
      },
    });

    res.status(201).json({
      message: "Resource uploaded successfully!",
      resource: newResource
    });
  } catch (error) {
    console.error("PRISMA_CREATE_ERROR:", error);
    res.status(500).json({ message: "Internal server error during upload", error: error.message });
  }
};

exports.getAllResources = async (req, res) => {
  try {
    const resources = await prisma.resource.findMany({
      include: {
        owner: { select: { email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(resources);
  } catch (error) {
    console.error("FETCH_RESOURCES_ERROR:", error);
    res.status(500).json({ message: "Could not fetch resources" });
  }
}; 

// Consolidated Stats Function
exports.incrementStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'views' or 'downloads'

    // Validation to prevent crashing if wrong type is sent
    if (type !== 'views' && type !== 'downloads') {
      return res.status(400).json({ message: "Invalid stat type" });
    }

    await prisma.resource.update({
      where: { id },
      data: { [type]: { increment: 1 } }
    });

    res.status(200).json({ message: `${type} updated` });
  } catch (error) {
    console.error("STATS_ERROR:", error);
    res.status(500).json({ message: "Failed to update stats" });
  }
};

exports.deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.resource.delete({ where: { id } });
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("DELETE_ERROR:", error);
    res.status(500).json({ message: "Delete failed" });
  }
};