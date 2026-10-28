// Usage: npm run set-role -- someone@college.edu TEACHER
// Roles: STUDENT | TEACHER | ADMIN  (the only safe way to create an ADMIN)
require("dotenv").config();
const prisma = require("../src/db");

(async () => {
  const [email, role] = process.argv.slice(2);
  if (!email || !["STUDENT", "TEACHER", "ADMIN"].includes(role)) {
    console.error("Usage: npm run set-role -- <email> <STUDENT|TEACHER|ADMIN>");
    process.exit(1);
  }
  try {
    const user = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { role },
    });
    console.log(`OK: ${user.email} is now ${user.role}`);
  } catch (e) {
    console.error(e.code === "P2025" ? "No user with that email." : e.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
