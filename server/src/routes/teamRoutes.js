const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const requireTeamOwnership = require("../middleware/requireTeamOwnership");
const { joinLimiter } = require("../middleware/rateLimiters");
const teamController = require("../controllers/teamController");

router.use(auth);

router.post("/", requireRole("TEACHER", "ADMIN"), teamController.createTeam);
router.post("/join", joinLimiter, teamController.joinTeam);
router.get("/mine", teamController.getMyTeams);
router.delete("/:teamId/leave", teamController.leaveTeam);

// Teacher-only: must be a TEACHER (or ADMIN) AND own this specific team.
const teacher = requireRole("TEACHER", "ADMIN");
router.get("/:teamId/resources", teacher, requireTeamOwnership({ allowAdmin: true }), teamController.getTeamResources);
router.get("/:teamId/members", teacher, requireTeamOwnership(), teamController.getTeamMembers);
router.post("/:teamId/invite", teacher, requireTeamOwnership(), teamController.regenerateInviteCode);
router.delete("/:teamId/members/:userId", teacher, requireTeamOwnership(), teamController.removeMember);

module.exports = router;
