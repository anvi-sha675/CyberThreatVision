// metrics.js
const { Router } = require("express");
const { authenticate } = require("../middleware/auth");
const { sequelize } = require("../config/mysql");
const mr = Router();
mr.get("/ping", (req, res) => res.json({ ok: true }));
mr.get("/system", authenticate, async (req, res, next) => {
  try {
    const [rows] = await sequelize.query(
      "SELECT * FROM system_metrics ORDER BY recorded_at DESC LIMIT 100",
    );
    res.json({ metrics: rows });
  } catch (err) {
    next(err);
  }
});
module.exports = mr;
