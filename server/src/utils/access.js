// Central place that decides who may see which resource.
//  - Public resources (no team, approved) are visible to every logged-in user.
//  - A team resource is visible to: its uploader, the team's teacher, and team members once APPROVED.
//  - PENDING / FLAGGED team resources are visible only to the uploader and the teacher.
//  - ADMIN sees everything.
const visibilityWhere = (user) => {
  if (user?.role === "ADMIN") return {};

  const or = [{ teamId: null, status: "APPROVED" }];
  if (user) {
    or.push(
      { ownerId: user.id },
      { team: { teacherId: user.id } },
      { status: "APPROVED", team: { memberships: { some: { userId: user.id } } } },
    );
  }
  return { OR: or };
};

const emailName = (email) => (email ? String(email).split("@")[0] : "user");

// What the browser receives. Never includes the uploader's email or the raw storage URL.
const serializeResource = (r) => {
  const { owner, bookmarks, fileUrl, ...rest } = r; // eslint-disable-line no-unused-vars
  return {
    ...rest,
    ownerName: emailName(owner?.email),
    bookmarked: Array.isArray(bookmarks) && bookmarks.length > 0,
  };
};

module.exports = { visibilityWhere, serializeResource, emailName };
