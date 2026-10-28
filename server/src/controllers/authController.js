const crypto = require("crypto");
const prisma = require("../db");
const bcrypt = require("bcryptjs");
const { signToken } = require("../utils/token");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_COST = 12;
// bcrypt only uses the first 72 bytes, so longer passwords give a false sense of security.
const MAX_PASSWORD_LENGTH = 72;
// Keeps login timing the same whether or not the email exists.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_COST);

const allowedDomains = () =>
  (process.env.ALLOWED_EMAIL_DOMAINS || "")
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);

const safeEqual = (a, b) => {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

const cleanEmail = (v) => (typeof v === "string" ? v.trim().toLowerCase() : "");

exports.register = async (req, res) => {
  try {
    const email = cleanEmail(req.body?.email);
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const teacherCode = typeof req.body?.teacherCode === "string" ? req.body.teacherCode.trim() : "";

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }
    const domains = allowedDomains();
    if (domains.length && !domains.includes(email.split("@")[1])) {
      return res.status(403).json({ message: `Sign-up is limited to: ${domains.map((d) => "@" + d).join(", ")}` });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
      return res.status(400).json({ message: `Password must be at most ${MAX_PASSWORD_LENGTH} characters` });
    }

    // The role is NEVER read from the request body. Everyone is a STUDENT unless they present
    // the secret TEACHER_INVITE_CODE (optional; leave it unset to disable). Admins are only
    // created with `npm run set-role` or by another admin.
    let role = "STUDENT";
    if (teacherCode) {
      const expected = process.env.TEACHER_INVITE_CODE;
      if (!expected || !safeEqual(teacherCode, expected)) {
        return res.status(403).json({ message: "Invalid teacher access code" });
      }
      role = "TEACHER";
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);
    await prisma.user.create({ data: { email, password: hashedPassword, role } });

    return res.status(201).json({ message: "User created successfully", role });
  } catch (error) {
    if (error?.code === "P2002") {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    console.error("REGISTRATION_ERROR:", error);
    return res.status(500).json({ message: "Internal server error during registration" });
  }
};

exports.login = async (req, res) => {
  try {
    const email = cleanEmail(req.body?.email);
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const isMatch = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
    if (!user || !isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.status(200).json({
      token: signToken(user),
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("LOGIN_ERROR:", error);
    return res.status(500).json({ message: "Internal server error during login" });
  }
};

exports.BCRYPT_COST = BCRYPT_COST;
exports.MAX_PASSWORD_LENGTH = MAX_PASSWORD_LENGTH;
