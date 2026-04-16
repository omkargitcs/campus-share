const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        email: true,
        role: true,
        createdAt: true,
        resources: {
          select: { id: true, title: true, createdAt: true },
          orderBy: { createdAt: 'desc' }
        },
        _count: { select: { resources: true } }
      }
    });
    res.json(user);
  } catch (error) {
    console.error("PROFILER_ERR:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
};