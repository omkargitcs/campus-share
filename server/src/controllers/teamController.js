const crypto = require("crypto");
const prisma = require("../db");
const notify = require("../utils/notify");
const { serializeResource, emailName } = require("../utils/access");

// 10 hex chars = ~1 trillion combinations; together with the join rate limit, guessing is impractical.
const generateInviteCode = () => crypto.randomBytes(5).toString("hex").toUpperCase();
const MAX_TEAMS_PER_TEACHER = 30;

const createWithUniqueCode = async (name, teacherId) => {
  for (let i = 0; i < 5; i++) {
    try {
      return await prisma.team.create({ data: { name, inviteCode: generateInviteCode(), teacherId } });
    } catch (err) {
      if (err.code !== "P2002") throw err; // retry only on invite-code collisions
    }
  }
  throw new Error("Could not generate a unique invite code");
};

// TEACHER / ADMIN creates a team
exports.createTeam = async (req, res) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (name.length < 2) return res.status(400).json({ message: "Team name must be at least 2 characters" });
    if (name.length > 80) return res.status(400).json({ message: "Team name must be 80 characters or fewer" });

    const count = await prisma.team.count({ where: { teacherId: req.user.id } });
    if (count >= MAX_TEAMS_PER_TEACHER) {
      return res.status(400).json({ message: `You can own at most ${MAX_TEAMS_PER_TEACHER} teams` });
    }

    const team = await createWithUniqueCode(name, req.user.id);
    res.status(201).json(team);
  } catch (error) {
    console.error("CREATE_TEAM_ERROR:", error);
    res.status(500).json({ message: "Failed to create team" });
  }
};

// Any logged-in user joins with an invite code
exports.joinTeam = async (req, res) => {
  try {
    const inviteCode = typeof req.body?.inviteCode === "string" ? req.body.inviteCode.trim().toUpperCase() : "";
    if (!inviteCode) return res.status(400).json({ message: "Invite code is required" });

    const team = await prisma.team.findUnique({ where: { inviteCode } });
    if (!team) return res.status(404).json({ message: "Invalid invite code" });

    if (team.teacherId === req.user.id) {
      return res.status(400).json({ message: "You already own this team" });
    }

    const key = { teamId_userId: { teamId: team.id, userId: req.user.id } };
    if (await prisma.teamMember.findUnique({ where: key })) {
      return res.status(200).json({ message: `You are already in "${team.name}"`, teamId: team.id });
    }

    try {
      await prisma.teamMember.create({ data: { teamId: team.id, userId: req.user.id } });
    } catch (err) {
      if (err.code !== "P2002") throw err; // double-click race: already joined, that's fine
      return res.status(200).json({ message: `You are already in "${team.name}"`, teamId: team.id });
    }
    notify(team.teacherId, `${emailName(req.user.email)} joined ${team.name}.`);

    res.status(200).json({ message: `Joined "${team.name}" successfully`, teamId: team.id });
  } catch (error) {
    console.error("JOIN_TEAM_ERROR:", error);
    res.status(500).json({ message: "Failed to join team" });
  }
};

exports.leaveTeam = async (req, res) => {
  try {
    const team = await prisma.team.findUnique({ where: { id: req.params.teamId }, select: { name: true } });
    const { count } = await prisma.teamMember.deleteMany({
      where: { teamId: req.params.teamId, userId: req.user.id },
    });
    if (!team || count === 0) return res.status(404).json({ message: "You are not a member of this team" });
    res.status(200).json({ message: `You left "${team.name}"` });
  } catch (error) {
    console.error("LEAVE_TEAM_ERROR:", error);
    res.status(500).json({ message: "Failed to leave team" });
  }
};

// Teams the current user teaches or belongs to
exports.getMyTeams = async (req, res) => {
  try {
    const [teaching, memberships] = await Promise.all([
      prisma.team.findMany({
        where: { teacherId: req.user.id },
        include: { _count: { select: { memberships: true, resources: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.teamMember.findMany({
        where: { userId: req.user.id },
        include: { team: { select: { id: true, name: true, teacher: { select: { email: true } } } } },
        orderBy: { joinedAt: "desc" },
      }),
    ]);

    // How many uploads are waiting for review in each team I teach
    const pending = teaching.length
      ? await prisma.resource.groupBy({
          by: ["teamId"],
          where: { teamId: { in: teaching.map((t) => t.id) }, status: "PENDING" },
          _count: { _all: true },
        })
      : [];
    const pendingByTeam = new Map(pending.map((p) => [p.teamId, p._count._all]));

    res.status(200).json({
      teaching: teaching.map(({ _count, ...t }) => ({
        ...t,
        _count: { members: _count.memberships, resources: _count.resources },
        pendingCount: pendingByTeam.get(t.id) || 0,
      })),
      joined: memberships.map((m) => ({
        id: m.team.id,
        name: m.team.name,
        teacherName: emailName(m.team.teacher.email),
        joinedAt: m.joinedAt,
      })),
    });
  } catch (error) {
    console.error("GET_MY_TEAMS_ERROR:", error);
    res.status(500).json({ message: "Failed to fetch teams" });
  }
};

// Teacher: every upload in one team (pending, approved, flagged)
exports.getTeamResources = async (req, res) => {
  try {
    const resources = await prisma.resource.findMany({
      where: { teamId: req.team.id },
      include: { owner: { select: { email: true } }, team: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    // Teachers need to know who uploaded what, so the email is included here only.
    res.status(200).json(resources.map((r) => ({ ...serializeResource(r), ownerEmail: r.owner.email })));
  } catch (error) {
    console.error("GET_TEAM_RESOURCES_ERROR:", error);
    res.status(500).json({ message: "Failed to fetch team resources" });
  }
};

exports.getTeamMembers = async (req, res) => {
  try {
    const memberships = await prisma.teamMember.findMany({
      where: { teamId: req.team.id },
      include: { user: { select: { id: true, email: true } } },
      orderBy: { joinedAt: "asc" },
    });
    res.status(200).json(memberships.map((m) => ({ id: m.user.id, email: m.user.email, joinedAt: m.joinedAt })));
  } catch (error) {
    console.error("GET_TEAM_MEMBERS_ERROR:", error);
    res.status(500).json({ message: "Failed to fetch members" });
  }
};

exports.regenerateInviteCode = async (req, res) => {
  try {
    for (let i = 0; i < 5; i++) {
      try {
        const team = await prisma.team.update({
          where: { id: req.team.id },
          data: { inviteCode: generateInviteCode() },
        });
        return res.status(200).json({ inviteCode: team.inviteCode });
      } catch (err) {
        if (err.code !== "P2002") throw err;
      }
    }
    throw new Error("Could not generate a unique invite code");
  } catch (error) {
    console.error("REGENERATE_INVITE_ERROR:", error);
    res.status(500).json({ message: "Failed to regenerate invite code" });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { count } = await prisma.teamMember.deleteMany({
      where: { teamId: req.team.id, userId: req.params.userId },
    });
    if (count === 0) return res.status(404).json({ message: "That user is not in this team" });

    notify(req.params.userId, `You were removed from ${req.team.name}.`);
    res.status(200).json({ message: "Member removed" });
  } catch (error) {
    console.error("REMOVE_MEMBER_ERROR:", error);
    res.status(500).json({ message: "Failed to remove member" });
  }
};
