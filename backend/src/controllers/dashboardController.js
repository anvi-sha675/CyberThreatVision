const { sequelize } = require("../config/mysql");
const datasetService = require("../services/datasetService");
const { isMLAvailable } = require("../services/mlService");

const getStats = async (req, res, next) => {
  try {
    const dsStats = datasetService.getStats();
    const [[scanStats], [alertStats], [blockStats]] = await Promise.all([
      sequelize.query(
        `SELECT COUNT(*) as total, SUM(is_threat=1) as threats, SUM(risk_level='critical') as critical FROM scan_logs WHERE scanned_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
      ),
      sequelize.query(
        `SELECT COUNT(*) as total, SUM(status='active') as active, SUM(severity='critical') as critical FROM alert_log WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
      ),
      sequelize.query(`SELECT COUNT(*) as total FROM blocked_ips`),
    ]);

    res.json({
      datasets: dsStats,
      scans_24h: scanStats[0],
      alerts_24h: alertStats[0],
      blocked_ips: blockStats[0]?.total || 0,
      ml_online: isMLAvailable(),
      mode: process.env.OFFLINE_MODE === "true" ? "offline" : "hybrid",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

const getTimeline = async (req, res, next) => {
  try {
    const [rows] = await sequelize.query(`
      SELECT DATE_FORMAT(scanned_at,'%Y-%m-%d %H:00:00') as hour,
             risk_level, COUNT(*) as count
      FROM scan_logs
      WHERE scanned_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY hour, risk_level ORDER BY hour
    `);

    const buckets = {};
    rows.forEach((r) => {
      if (!buckets[r.hour])
        buckets[r.hour] = {
          hour: r.hour,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        };
      buckets[r.hour][r.risk_level] = r.count;
    });
    res.json({ timeline: Object.values(buckets) });
  } catch (err) {
    next(err);
  }
};

const getTopThreats = async (req, res, next) => {
  try {
    const [rows] = await sequelize.query(`
      SELECT target, scan_type, risk_score, risk_level, scanned_at
      FROM scan_logs WHERE is_threat = 1
      ORDER BY risk_score DESC, scanned_at DESC
      LIMIT 10
    `);
    res.json({ threats: rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats, getTimeline, getTopThreats };
