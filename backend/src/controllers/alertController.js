const { sequelize } = require("../config/mysql");
const { v4: uuidv4 } = require("uuid");

const getAlerts = async (req, res, next) => {
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
        `SELECT COUNT(*) as total FROM alert_log WHERE ${where.join(" AND ")}`,
        { replacements: repl },
      ),
      sequelize.query(
        `SELECT * FROM alert_log WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        { replacements: [...repl, parseInt(limit), offset] },
      ),
    ]);
    res.json({ alerts: rows, total, page: parseInt(page) });
  } catch (err) {
    next(err);
  }
};

const createAlert = async (req, res, next) => {
  try {
    const { alert_type, severity, source_ip, description, details } = req.body;
    const alertId = `ALT-${uuidv4().slice(0, 8).toUpperCase()}`;
    await sequelize.query(
      `INSERT INTO alert_log (alert_id,alert_type,severity,source_ip,description,details) VALUES (?,?,?,?,?,?)`,
      {
        replacements: [
          alertId,
          alert_type,
          severity || "medium",
          source_ip,
          description,
          JSON.stringify(details || {}),
        ],
      },
    );
    const [rows] = await sequelize.query(
      "SELECT * FROM alert_log WHERE alert_id=?",
      { replacements: [alertId] },
    );
    res.status(201).json({ alert: rows[0] });
  } catch (err) {
    next(err);
  }
};

const updateAlertStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    await sequelize.query("UPDATE alert_log SET status=? WHERE id=?", {
      replacements: [status, req.params.id],
    });
    res.json({ message: "Alert updated", id: req.params.id, status });
  } catch (err) {
    next(err);
  }
};

const getAlertStats = async (req, res, next) => {
  try {
    const [[stats], [byType]] = await Promise.all([
      sequelize.query(
        `SELECT COUNT(*) as total, SUM(status='active') as active, SUM(status='resolved') as resolved, SUM(severity='critical') as critical, SUM(severity='high') as high FROM alert_log`,
      ),
      sequelize.query(
        `SELECT alert_type, COUNT(*) as count FROM alert_log GROUP BY alert_type ORDER BY count DESC LIMIT 10`,
      ),
    ]);
    res.json({ stats: stats[0], by_type: byType });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAlerts, createAlert, updateAlertStatus, getAlertStats };
