const prisma = require("../db");

// Notifications must never break the request that triggered them.
const notify = async (userId, message) => {
  try {
    if (!userId) return;
    await prisma.notification.create({ data: { userId, message: String(message).slice(0, 300) } });
  } catch (err) {
    console.error("NOTIFY_ERROR (non-fatal):", err.message);
  }
};

module.exports = notify;
