const crypto = require("crypto");
const prisma = require("../db");
const notify = require("../utils/notify");
const s3 = require("../utils/s3");
const { visibilityWhere, serializeResource, emailName } = require("../utils/access");

const CATEGORIES = ["Notes", "Book", "PYQ"];

const withRelations = (userId) => ({
  owner: { select: { email: true } },
  team: { select: { id: true, name: true } },
  bookmarks: { where: { userId }, select: { userId: true } },
});

// ---------- Upload ----------
exports.uploadResource = async (req, res) => {
  let uploadedKey = null;
  try {
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const category = typeof req.body.category === "string" ? req.body.category.trim() : "";
    const description = typeof req.body.description === "string" ? req.body.description.trim() : "";
    const teamId = typeof req.body.teamId === "string" && req.body.teamId ? req.body.teamId : null;
    const price = Math.min(Math.max(parseFloat(req.body.price) || 0, 0), 100000);

    if (!title || !category) {
      return res.status(400).json({ message: "Title and Category are required" });
    }
    if (title.length > 150) {
      return res.status(400).json({ message: "Title must be 150 characters or fewer" });
    }
    if (description.length > 1000) {
      return res.status(400).json({ message: "Description must be 1000 characters or fewer" });
    }
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ message: `Category must be one of: ${CATEGORIES.join(", ")}` });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file" });
    }
    // The browser-supplied mimetype can be faked, so check the real file signature too.
    if (req.file.buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
      return res.status(400).json({ message: "The file is not a valid PDF" });
    }

    // Team uploads: only the team's teacher or a member (or an admin) may post into it.
    let team = null;
    let status = "APPROVED";
    if (teamId) {
      team = await prisma.team.findUnique({
        where: { id: teamId },
        include: { memberships: { where: { userId: req.user.id }, select: { userId: true } } },
      });
      const isTeacher = team?.teacherId === req.user.id;
      const isMember = !!team && team.memberships.length > 0;
      const isAdmin = req.user.role === "ADMIN";
      if (!team || (!isTeacher && !isMember && !isAdmin)) {
        return res.status(403).json({ message: "You are not a member of this team" });
      }
      // Teacher/admin uploads are trusted; student uploads wait for approval.
      status = isTeacher || isAdmin ? "APPROVED" : "PENDING";
    }

    // Random key: nothing user-controlled and nothing guessable.
    uploadedKey = `resources/${crypto.randomUUID()}.pdf`;
    await s3.putPdf(uploadedKey, req.file.buffer);

    const created = await prisma.resource.create({
      data: {
        title,
        description: description || null,
        category,
        price,
        fileUrl: s3.publicUrlForKey(uploadedKey),
        ownerId: req.user.id,
        teamId,
        status,
      },
      include: withRelations(req.user.id),
    });

    if (status === "PENDING" && team) {
      notify(team.teacherId, `${emailName(req.user.email)} uploaded "${title}" to ${team.name} and it needs your review.`);
    }

    res.status(201).json({
      message: status === "PENDING" ? "Uploaded. Waiting for teacher approval." : "Resource uploaded successfully!",
      resource: serializeResource(created),
    });
  } catch (error) {
    console.error("UPLOAD_ERROR:", error);
    if (uploadedKey) s3.deleteObject(uploadedKey); // don't leave orphan files behind
    res.status(500).json({ message: "Upload failed. Please try again." });
  }
};

// ---------- List (only what the caller is allowed to see) ----------
exports.getAllResources = async (req, res) => {
  try {
    const resources = await prisma.resource.findMany({
      where: visibilityWhere(req.user),
      include: withRelations(req.user.id),
      orderBy: { createdAt: "desc" },
      take: 300,
    });
    res.status(200).json(resources.map(serializeResource));
  } catch (error) {
    console.error("GET_ALL_RESOURCES_ERROR:", error);
    res.status(500).json({ message: "Failed to fetch resources" });
  }
};

// ---------- Open: permission-checked, counted on the server, link expires in 5 minutes ----------
exports.getAccessUrl = async (req, res) => {
  try {
    const resource = await prisma.resource.findFirst({
      where: { AND: [{ id: req.params.id }, visibilityWhere(req.user)] },
    });
    // Same answer for "missing" and "not allowed" so ids can't be probed.
    if (!resource || !resource.fileUrl) {
      return res.status(404).json({ message: "Resource not found" });
    }
    const key = s3.keyFromUrl(resource.fileUrl);
    if (!key) {
      return res.status(404).json({ message: "Resource file not found" });
    }

    const url = await s3.presignedGetUrl(key);
    const updated = await prisma.resource.update({
      where: { id: resource.id },
      data: { downloads: { increment: 1 } },
      select: { downloads: true },
    });
    res.status(200).json({ url, downloads: updated.downloads });
  } catch (error) {
    console.error("ACCESS_URL_ERROR:", error);
    res.status(500).json({ message: "Could not open this resource" });
  }
};

// ---------- Delete: owner, the team's teacher, or admin ----------
exports.deleteResource = async (req, res) => {
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: req.params.id },
      include: { team: { select: { teacherId: true } } },
    });
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const isOwner = resource.ownerId === req.user.id;
    const isAdmin = req.user.role === "ADMIN";
    const isTeamTeacher = resource.team?.teacherId === req.user.id;
    if (!isOwner && !isAdmin && !isTeamTeacher) {
      return res.status(403).json({ message: "You do not have permission to delete this resource" });
    }

    await prisma.resource.delete({ where: { id: resource.id } });
    const key = resource.fileUrl && s3.keyFromUrl(resource.fileUrl);
    if (key) s3.deleteObject(key);

    res.status(200).json({ message: "Resource deleted successfully" });
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ message: "Resource not found" });
    console.error("DELETE_RESOURCE_ERROR:", error);
    res.status(500).json({ message: "Failed to delete resource" });
  }
};

// ---------- Moderation: the team's teacher or an admin ----------
exports.updateResourceStatus = async (req, res) => {
  try {
    const status = typeof req.body?.status === "string" ? req.body.status.toUpperCase() : "";
    if (!["APPROVED", "FLAGGED"].includes(status)) {
      return res.status(400).json({ message: "Status must be APPROVED or FLAGGED" });
    }

    const resource = await prisma.resource.findUnique({
      where: { id: req.params.id },
      include: { team: true },
    });
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    const isTeamTeacher = resource.team && resource.team.teacherId === req.user.id;
    if (!isTeamTeacher && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "You cannot moderate this resource" });
    }
    if (!resource.teamId) {
      return res.status(400).json({ message: "Only team uploads can be moderated" });
    }

    const updated = await prisma.resource.update({ where: { id: resource.id }, data: { status } });

    if (resource.ownerId !== req.user.id && resource.status !== status) {
      notify(
        resource.ownerId,
        status === "APPROVED"
          ? `Your upload "${resource.title}" was approved in ${resource.team.name}.`
          : `Your upload "${resource.title}" was flagged in ${resource.team.name}.`,
      );
    }
    const { fileUrl, ...safe } = updated; // eslint-disable-line no-unused-vars
    res.status(200).json(safe);
  } catch (error) {
    console.error("UPDATE_RESOURCE_STATUS_ERROR:", error);
    res.status(500).json({ message: "Failed to update resource status" });
  }
};

// ---------- Save / unsave (both idempotent) ----------
exports.addBookmark = async (req, res) => {
  try {
    const resource = await prisma.resource.findFirst({
      where: { AND: [{ id: req.params.id }, visibilityWhere(req.user)] },
      select: { id: true },
    });
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    await prisma.bookmark.upsert({
      where: { userId_resourceId: { userId: req.user.id, resourceId: resource.id } },
      create: { userId: req.user.id, resourceId: resource.id },
      update: {},
    });
    res.status(200).json({ bookmarked: true });
  } catch (error) {
    console.error("ADD_BOOKMARK_ERROR:", error);
    res.status(500).json({ message: "Failed to save resource" });
  }
};

exports.removeBookmark = async (req, res) => {
  try {
    await prisma.bookmark.deleteMany({ where: { userId: req.user.id, resourceId: req.params.id } });
    res.status(200).json({ bookmarked: false });
  } catch (error) {
    console.error("REMOVE_BOOKMARK_ERROR:", error);
    res.status(500).json({ message: "Failed to update saved items" });
  }
};
