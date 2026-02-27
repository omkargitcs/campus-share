const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


exports.uploadResource = async (req, res) => {
  try {
    const { title, description, category, price, fileUrl } = req.body;

    if (!title || !category) {
      return res.status(400).json({ message: "Title and Category are required" });
    }

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