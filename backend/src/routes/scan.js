const { Router } = require("express");
const { authenticate } = require("../middleware/auth");
const {
  scanURL,
  scanIP,
  scanHash,
  bulkScan,
  getScanHistory,
} = require("../controllers/scanController");
const r = Router();
r.use(authenticate);
r.post("/url", scanURL);
r.post("/ip", scanIP);
r.post("/hash", scanHash);
r.post("/bulk", bulkScan);
r.get("/history", getScanHistory);
module.exports = r;
