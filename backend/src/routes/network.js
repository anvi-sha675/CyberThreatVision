const { Router } = require("express");
const { authenticate } = require("../middleware/auth");
const r = Router();
r.use(authenticate);
// Simulated network stats from dataset
r.get("/stats", (req, res) => {
  const { datasets } = require("../services/datasetService");
  res.json({
    stats: {
      total_connections: Math.floor(Math.random() * 2000) + 500,
      bytes_in: Math.floor(Math.random() * 1e9),
      bytes_out: Math.floor(Math.random() * 5e8),
      blocked: datasets.ips.filter((i) => parseInt(i.abuse_score || 0) >= 80)
        .length,
    },
    top_countries: datasets.ips.reduce((acc, ip) => {
      const c = ip.country_code;
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {}),
  });
});
module.exports = r;
