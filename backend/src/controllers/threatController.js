const { sequelize } = require("../config/mysql");
const datasetService = require("../services/datasetService");
const { emitThreat } = require("../services/socketService");
const { v4: uuidv4 } = require("uuid");

const getThreats = async (req, res, next) => {
  try {
    const { severity, status, limit = 50, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = ["1=1"],
      repl = [];
    if (severity) {
      where.push("severity=?");
      repl.push(severity);
    }
    if (status) {
      where.push("status=?");
      repl.push(status);
    }
    const [[{ total }], [rows]] = await Promise.all([
      sequelize.query(
        `SELECT COUNT(*) as total FROM threat_events WHERE ${where.join(" AND ")}`,
        { replacements: repl },
      ),
      sequelize.query(
        `SELECT * FROM threat_events WHERE ${where.join(" AND ")} ORDER BY reported_at DESC LIMIT ? OFFSET ?`,
        { replacements: [...repl, parseInt(limit), offset] },
      ),
    ]);
    res.json({ threats: rows, total, page: parseInt(page) });
  } catch (err) {
    next(err);
  }
};

const getLiveFeed = async (req, res, next) => {
  try {
    const [rows] = await sequelize.query(
      "SELECT * FROM threat_events ORDER BY reported_at DESC LIMIT 100",
    );
    // Supplement with dataset if DB is sparse
    if (rows.length < 20) {
      const dsIPs = datasetService.queryIPs({ minScore: 60, limit: 50 });
      const mapped = dsIPs.slice(0, 30 - rows.length).map((ip) => ({
        ip_address: ip.ip_address,
        country_code: ip.country_code,
        country_name: ip.country_name,
        isp: ip.isp,
        attack_type: (ip.attack_types || "Port Scanning").split(",")[0].trim(),
        severity:
          parseInt(ip.abuse_score) >= 90
            ? "critical"
            : parseInt(ip.abuse_score) >= 70
              ? "high"
              : "medium",
        risk_score: parseInt(ip.abuse_score),
        source: "dataset",
        reported_at: ip.last_seen || new Date().toISOString(),
        status: "active",
      }));
      return res.json({ feed: [...rows, ...mapped] });
    }
    res.json({ feed: rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { getThreats, getLiveFeed };
