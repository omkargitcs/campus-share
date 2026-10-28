const rateLimit = require("express-rate-limit");

const make = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message },
  });

module.exports = {
  globalLimiter: make(15 * 60 * 1000, 600, "Too many requests. Please slow down."),
  loginLimiter: make(15 * 60 * 1000, 10, "Too many login attempts. Please try again later."),
  registerLimiter: make(60 * 60 * 1000, 10, "Too many sign-ups from this network. Please try again later."),
  // Invite codes are guessable by brute force if unlimited.
  joinLimiter: make(15 * 60 * 1000, 15, "Too many join attempts. Please try again later."),
  passwordLimiter: make(60 * 60 * 1000, 10, "Too many password attempts. Please try again later."),
  uploadLimiter: make(60 * 60 * 1000, 30, "Upload limit reached. Please try again later."),
};
