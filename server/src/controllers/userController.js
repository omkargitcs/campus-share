const prisma = require("../db");
const bcrypt = require("bcryptjs");
const { signToken } = require("../utils/token");
const { BCRYPT_COST, MAX_PASSWORD_LENGTH } = require("./authController");

const ROLES = ["STUDENT", "TEACHER", "ADMIN"];

exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        resources: {
          select: { id: true, title: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { resources: true } },
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("PROFILE_ERROR:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
};

// Changing the password signs every other session out and hands this one a fresh token.
exports.changePassword = async (req, res) => {
  try {
    const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
    const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }
    if (newPassword.length > MAX_PASSWORD_LENGTH) {
      return res.status(400).json({ message: `New password must be at most ${MAX_PASSWORD_LENGTH} characters` });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 400, not 401: a 401 would make the app think the session expired and log the user out.
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "New password must be different from the current one" });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(newPassword, BCRYPT_COST),
        // whole seconds, because JWT "iat" is in whole seconds
        passwordChangedAt: new Date(Math.floor(Date.now() / 1000) * 1000),
      },
    });

    res.status(200).json({ message: "Password updated", token: signToken(updated) });
  } catch (error) {
    console.error("CHANGE_PASSWORD_ERROR:", error);
    res.status(500).json({ message: "Failed to update password" });
  }
};

// ---------- Admin ----------
exports.searchUsers = async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
    const users = await prisma.user.findMany({
      where: q ? { email: { contains: q, mode: "insensitive" } } : {},
      select: { id: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 25,
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("SEARCH_USERS_ERROR:", error);
    res.status(500).json({ message: "Failed to search users" });
  }
};

exports.setUserRole = async (req, res) => {
  try {
    const role = typeof req.body?.role === "string" ? req.body.role.toUpperCase() : "";
    if (!ROLES.includes(role)) {
      return res.status(400).json({ message: `Role must be one of: ${ROLES.join(", ")}` });
    }
    // Stops the last admin from locking everyone out by demoting themselves.
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "You cannot change your own role" });
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, role: true },
    });
    res.status(200).json(user);
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ message: "User not found" });
    console.error("SET_ROLE_ERROR:", error);
    res.status(500).json({ message: "Failed to update role" });
  }
};
