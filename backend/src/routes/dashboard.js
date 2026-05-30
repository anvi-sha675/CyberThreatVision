const { Router } = require("express");
const { authenticate } = require("../middleware/auth");
const {
  getStats,
  getTimeline,
  getTopThreats,
} = require("../controllers/dashboardController");
const router = Router();
router.use(authenticate);
router.get("/stats", getStats);
router.get("/timeline", getTimeline);
router.get("/top-threats", getTopThreats);
module.exports = router;
