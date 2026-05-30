const { sequelize } = require("../config/mysql");

const getActivityLogs = async (req, res, next) => {
  try {
    const { limit = 100, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [[{ total }], [rows]] = await Promise.all([
      sequelize.query("SELECT COUNT(*) as total FROM activity_log"),
      sequelize.query(
        "SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ? OFFSET ?",
        { replacements: [parseInt(limit), offset] },
      ),
    ]);
    res.json({ logs: rows, total, page: parseInt(page) });
  } catch (err) {
    next(err);
  }
};

const getScanLogs = async (req, res, next) => {
  try {
    const { limit = 100, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [[{ total }], [rows]] = await Promise.all([
      sequelize.query("SELECT COUNT(*) as total FROM scan_logs"),
      sequelize.query(
        "SELECT id,scan_type,target,risk_score,risk_level,is_threat,source,scanned_at FROM scan_logs ORDER BY scanned_at DESC LIMIT ? OFFSET ?",
        { replacements: [parseInt(limit), offset] },
      ),
    ]);
    res.json({ logs: rows, total, page: parseInt(page) });
  } catch (err) {
    next(err);
  }
};

module.exports = { getActivityLogs, getScanLogs };
