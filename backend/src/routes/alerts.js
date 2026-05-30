const { Router } = require("express");
const { authenticate } = require("../middleware/auth");
const {
  getAlerts,
  createAlert,
  updateAlertStatus,
  getAlertStats,
} = require("../controllers/alertController");
const r = Router();
r.use(authenticate);
r.get("/", getAlerts);
r.get("/stats", getAlertStats);
r.post("/", createAlert);
r.patch("/:id/status", updateAlertStatus);
module.exports = r;
