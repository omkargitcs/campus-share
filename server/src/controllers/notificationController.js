const prisma = require("../db");

exports.listNotifications = async (req, res) => {
  try {
    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
    ]);
    res.status(200).json({ items, unreadCount });
  } catch (error) {
    console.error("LIST_NOTIFICATIONS_ERROR:", error);
    res.status(500).json({ message: "Failed to load notifications" });
  }
};

exports.markOneRead = async (req, res) => {
  try {
    // userId in the filter means nobody can touch someone else's notification
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { isRead: true },
    });
    res.status(200).json({ message: "Marked as read" });
  } catch (error) {
    console.error("MARK_ONE_READ_ERROR:", error);
    res.status(500).json({ message: "Failed to update notification" });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("MARK_READ_ERROR:", error);
    res.status(500).json({ message: "Failed to update notifications" });
  }
};
