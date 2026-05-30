const { sequelize } = require("../config/mysql");
const mlService = require("../services/mlService");
const datasetService = require("../services/datasetService");
const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");

// POST /api/scan/url
const scanURL = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "url required" });

    const result = await mlService.analyzeURL(url);

    // Log to MySQL
    await sequelize.query(
      `INSERT INTO scan_logs (scan_type, target, risk_score, risk_level, is_threat, source, result_json, user_id, ip_address)
       VALUES ('url', ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          url.slice(0, 500),
          Math.round((result.phishing_score || 0) * 100),
          result.risk_level || "low",
          result.is_phishing ? 1 : 0,
          result.source || "rules",
          JSON.stringify(result),
          req.user?.id || null,
          req.ip,
        ],
      },
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/scan/ip
const scanIP = async (req, res, next) => {
  try {
    const { ip } = req.body;
    if (!ip) return res.status(400).json({ error: "ip required" });

    const result = await mlService.analyzeIP(ip);

    await sequelize.query(
      `INSERT INTO scan_logs (scan_type, target, risk_score, risk_level, is_threat, source, result_json, user_id, ip_address)
       VALUES ('ip', ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          ip,
          result.risk_score || 0,
          result.risk_level || "low",
          result.risk_score >= 50 ? 1 : 0,
          result.source || "dataset",
          JSON.stringify(result),
          req.user?.id || null,
          req.ip,
        ],
      },
    );

    // Auto-block critical IPs
    if (result.risk_score >= 90) {
      await sequelize.query(
        `INSERT IGNORE INTO blocked_ips (ip_address, country_code, reason, risk_score)
         VALUES (?, ?, ?, ?)`,
        {
          replacements: [
            ip,
            result.details?.country_code || "XX",
            "Auto-blocked: critical risk",
            result.risk_score,
          ],
        },
      );
      // Create alert
      const alertId = `ALT-${uuidv4().slice(0, 8).toUpperCase()}`;
      await sequelize.query(
        `INSERT INTO alert_log (alert_id, alert_type, severity, source_ip, description)
         VALUES (?, 'Critical IP Detected', 'critical', ?, ?)`,
        {
          replacements: [
            alertId,
            ip,
            `Critical risk IP ${ip} detected — score ${result.risk_score}/100`,
          ],
        },
      );
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/scan/hash
const scanHash = async (req, res, next) => {
  try {
    const { hash } = req.body;
    if (!hash) return res.status(400).json({ error: "hash required" });

    const result = await mlService.analyzeHash(hash);

    await sequelize.query(
      `INSERT INTO scan_logs (scan_type, target, risk_score, risk_level, is_threat, source, result_json, user_id, ip_address)
       VALUES ('hash', ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          hash,
          result.found ? 85 : 0,
          result.found ? result.severity || "medium" : "low",
          result.found ? 1 : 0,
          "dataset",
          JSON.stringify(result),
          req.user?.id || null,
          req.ip,
        ],
      },
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/scan/bulk
const bulkScan = async (req, res, next) => {
  try {
    const { targets } = req.body;
    if (!targets || !Array.isArray(targets))
      return res.status(400).json({ error: "targets array required" });

    const result = await mlService.bulkScan(targets);

    // Log each result
    for (const r of result.results || []) {
      await sequelize.query(
        `INSERT INTO scan_logs (scan_type, target, risk_score, risk_level, is_threat, source, user_id, ip_address)
         VALUES (?, ?, ?, ?, ?, 'bulk', ?, ?)`,
        {
          replacements: [
            r.type,
            r.value.slice(0, 500),
            r.score || 0,
            r.risk_level || "low",
            r.is_threat ? 1 : 0,
            req.user?.id || null,
            req.ip,
          ],
        },
      );
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /api/scan/history
const getScanHistory = async (req, res, next) => {
  try {
    const { type, is_threat, limit = 50, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = ["1=1"];
    const replacements = [];

    if (type) {
      where.push("scan_type = ?");
      replacements.push(type);
    }
    if (is_threat !== undefined) {
      where.push("is_threat = ?");
      replacements.push(is_threat === "true" ? 1 : 0);
    }

    const [[{ total }], [rows]] = await Promise.all([
      sequelize.query(
        `SELECT COUNT(*) as total FROM scan_logs WHERE ${where.join(" AND ")}`,
        { replacements },
      ),
      sequelize.query(
        `SELECT id, scan_type, target, risk_score, risk_level, is_threat, source, scanned_at FROM scan_logs WHERE ${where.join(" AND ")} ORDER BY scanned_at DESC LIMIT ? OFFSET ?`,
        { replacements: [...replacements, parseInt(limit), offset] },
      ),
    ]);

    res.json({
      scans: rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { scanURL, scanIP, scanHash, bulkScan, getScanHistory };
