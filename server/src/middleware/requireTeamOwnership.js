const prisma = require("../db");

// Confirms the logged-in user is the TEACHER who owns this specific team (id in req.params.teamId).
// Pass { allowAdmin: true } for read-only/moderation routes admins may also use.
const requireTeamOwnership =
  ({ allowAdmin = false } = {}) =>
  async (req, res, next) => {
    try {
      const team = await prisma.team.findUnique({ where: { id: req.params.teamId } });
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      const isOwner = team.teacherId === req.user.id;
      if (!isOwner && !(allowAdmin && req.user.role === "ADMIN")) {
        return res.status(403).json({ message: "You do not own this team" });
      }
      req.team = team;
      next();
    } catch (error) {
      console.error("TEAM_OWNERSHIP_CHECK_ERROR:", error);
      res.status(500).json({ message: "Error verifying team ownership" });
    }
  };

module.exports = requireTeamOwnership;
