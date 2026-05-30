const { Router } = require("express");
const { authenticate } = require("../middleware/auth");
const {
  getActivityLogs,
  getScanLogs,
} = require("../controllers/logsController");
const r = Router();
r.use(authenticate);
r.get("/activity", getActivityLogs);
r.get("/scans", getScanLogs);
module.exports = r;
