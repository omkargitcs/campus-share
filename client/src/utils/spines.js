// One colour per category: the "spine" on the left edge of every catalogue row.
const CATEGORY_SPINE = {
  Notes: "var(--sp-notes)",
  Book: "var(--sp-book)",
  PYQ: "var(--sp-pyq)",
};
export const spineFor = (category) => CATEGORY_SPINE[category] || "var(--muted)";

const TEAM_SPINES = ["var(--sp-notes)", "var(--sp-book)", "var(--sp-pyq)", "var(--sp-4)", "var(--sp-5)"];
// Stable colour per team name so a team keeps its spine between visits.
export const teamSpine = (name = "") => {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TEAM_SPINES[h % TEAM_SPINES.length];
};
