// dotenv must load BEFORE anything that reads process.env (S3 client, etc.)
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const multer = require("multer");

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set. Refusing to start.");
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.warn(
    "WARNING: JWT_SECRET is shorter than 32 characters. Use a long random string.",
  );
}

const { globalLimiter } = require("./middleware/rateLimiters");
const resourceRoutes = require("./routes/resourceRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const teamRoutes = require("./routes/teamRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// Render sits behind a proxy; without this every user looks like the same IP to the rate limiter.
app.set("trust proxy", 1);

app.use(helmet());

// CLIENT_ORIGIN = your frontend URL(s), comma separated (CLIENT_URL also works).
// Auth uses Bearer tokens (not cookies), so a missing value is tolerated but logged loudly.
const allowedOrigins = (
  process.env.CLIENT_ORIGIN ||
  process.env.CLIENT_URL ||
  ""
)
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);
if (allowedOrigins.length === 0) {
  console.warn(
    "WARNING: CLIENT_ORIGIN is not set; allowing requests from any origin. Set it to your frontend URL.",
  );
}
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "100kb" }));
app.use("/api", globalLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "CampusShare API IS ALIVE" });
});

app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Last-resort error handler (upload errors, bad JSON, ...). Never leaks stack traces.
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "File is too large (max 10MB)" });
    }
    return res.status(400).json({ message: "Invalid upload" });
  }
  if (err.expose && err.status === 400) {
    return res.status(400).json({ message: err.message });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON body" });
  }
  console.error("UNHANDLED_ERROR:", err);
  res.status(500).json({ message: "Something went wrong" });
});

process.on("unhandledRejection", (reason) =>
  console.error("UNHANDLED_REJECTION:", reason),
);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`SERVER IS RUNNING ON http://localhost:${PORT}`);
});

// Render sends SIGTERM on every deploy: finish in-flight requests, then exit cleanly.
process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 10000).unref();
});
