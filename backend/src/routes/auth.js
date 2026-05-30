// CyberThreatVision2 — All Routes (single file for brevity)
// Each module exports its own router

// ── auth.js ──────────────────────────────────────────────────
const { Router } = require("express");
const rateLimit = require("express-rate-limit");
const { login, logout, me } = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

const authRouter = Router();
authRouter.post(
  "/login",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }),
  login,
);
authRouter.post("/logout", authenticate, logout);
authRouter.get("/me", authenticate, me);
module.exports = authRouter;
