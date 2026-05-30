const { sequelize } = require("../config/mysql");
const datasetService = require("../services/datasetService");
const { isMLAvailable } = require("../services/mlService");
const os = require("os");

const getSystemHealth = async (req, res, next) => {
  try {
    const totalMem = os.totalmem(),
      freeMem = os.freemem();
    const [[dbStats]] = await sequelize.query(`
      SELECT
        (SELECT COUNT(*) FROM scan_logs WHERE scanned_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)) as scans_per_hour,
        (SELECT COUNT(*) FROM alert_log WHERE status='active') as active_alerts,
        (SELECT COUNT(*) FROM blocked_ips) as blocked_ips
    `);
    const dsStats = datasetService.getStats();

    res.json({
      system: {
        memory_used_mb: Math.round((totalMem - freeMem) / 1024 / 1024),
        memory_total_mb: Math.round(totalMem / 1024 / 1024),
        memory_percent: Math.round(((totalMem - freeMem) / totalMem) * 100),
        uptime_seconds: Math.round(process.uptime()),
        node_version: process.version,
        platform: os.platform(),
      },
      database: dbStats[0],
      datasets: dsStats,
      services: {
        ml_microservice: isMLAvailable(),
        offline_mode: process.env.OFFLINE_MODE === "true",
        demo_api_mode: process.env.DEMO_API_MODE === "true",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const [users] = await sequelize.query(
      "SELECT id,username,email,role,clearance,last_login,is_active,created_at FROM users ORDER BY id",
    );
    res.json({ users });
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const bcrypt = require("bcryptjs");
    const { username, email, password, role, clearance } = req.body;
    if (!username || !email || !password)
      return res
        .status(400)
        .json({ error: "username, email, password required" });
    const hash = await bcrypt.hash(password, 12);
    await sequelize.query(
      "INSERT INTO users (username,email,password_hash,role,clearance) VALUES (?,?,?,?,?)",
      {
        replacements: [
          username,
          email,
          hash,
          role || "viewer",
          clearance || "STANDARD",
        ],
      },
    );
    res.status(201).json({ message: `User ${username} created` });
  } catch (err) {
    next(err);
  }
};

const getTableStats = async (req, res, next) => {
  try {
    const tables = [
      "users",
      "scan_logs",
      "threat_events",
      "alert_log",
      "blocked_ips",
      "activity_log",
      "system_metrics",
    ];
    const results = await Promise.all(
      tables.map((t) =>
        sequelize
          .query(`SELECT '${t}' as table_name, COUNT(*) as row_count FROM ${t}`)
          .then(([rows]) => rows[0])
          .catch(() => ({ table_name: t, row_count: 0 })),
      ),
    );
    res.json({ tables: results });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSystemHealth, getUsers, createUser, getTableStats };
