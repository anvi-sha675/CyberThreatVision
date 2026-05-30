const cron = require("node-cron");
const { sequelize } = require("../config/mysql");
const datasetService = require("./datasetService");
const { emitThreat, emitMetrics } = require("./socketService");
const logger = require("../utils/logger");
const { v4: uuidv4 } = require("uuid");

// Simulate threat from dataset (replaces API call in offline mode)
const simulateThreatFromDataset = async () => {
  try {
    const ips = datasetService.datasets.ips;
    if (!ips.length) return;

    const ip = ips[Math.floor(Math.random() * ips.length)];
    const score = parseInt(ip.abuse_score || 50);
    const sev =
      score >= 90
        ? "critical"
        : score >= 70
          ? "high"
          : score >= 50
            ? "medium"
            : "low";
    const attackTypes = (ip.attack_types || "Port Scanning").split(",");
    const attackType =
      attackTypes[Math.floor(Math.random() * attackTypes.length)].trim();

    await sequelize.query(
      `INSERT INTO threat_events (ip_address, country_code, country_name, isp, attack_type, severity, risk_score, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'dataset')`,
      {
        replacements: [
          ip.ip_address,
          ip.country_code,
          ip.country_name,
          ip.isp,
          attackType,
          sev,
          score,
        ],
      },
    );

    const event = {
      ip_address: ip.ip_address,
      country_code: ip.country_code,
      country_name: ip.country_name,
      isp: ip.isp,
      attack_type: attackType,
      severity: sev,
      risk_score: score,
      source: "dataset",
      reported_at: new Date().toISOString(),
    };
    emitThreat(event);

    // Auto-alert for critical
    if (sev === "critical") {
      const alertId = `ALT-${uuidv4().slice(0, 8).toUpperCase()}`;
      await sequelize.query(
        `INSERT INTO alert_log (alert_id,alert_type,severity,source_ip,description) VALUES (?,?,?,?,?)`,
        {
          replacements: [
            alertId,
            attackType,
            sev,
            ip.ip_address,
            `Dataset threat: ${attackType} from ${ip.country_name} (score ${score})`,
          ],
        },
      );
    }
  } catch (err) {
    logger.debug(`Threat simulation: ${err.message}`);
  }
};

// Collect system metrics
const collectMetrics = async () => {
  try {
    const os = require("os");
    const mem = ((os.totalmem() - os.freemem()) / os.totalmem()) * 100;
    const metrics = [
      ["cpu_usage", Math.round(Math.random() * 40 + 15), "percent"],
      ["memory_usage", parseFloat(mem.toFixed(1)), "percent"],
      ["uptime_seconds", Math.round(process.uptime()), "seconds"],
    ];
    for (const [name, val, unit] of metrics) {
      await sequelize.query(
        "INSERT INTO system_metrics (metric_name,metric_value,unit) VALUES (?,?,?)",
        { replacements: [name, val, unit] },
      );
    }
    emitMetrics({ cpu: metrics[0][1], memory: metrics[1][1] });
  } catch (err) {
    logger.debug(`Metrics: ${err.message}`);
  }
};

const startJobs = () => {
  // Simulate dataset-driven threats every 4s in dev
  if (process.env.NODE_ENV === "development") {
    setInterval(simulateThreatFromDataset, 4000);
    logger.info("🔄 Threat simulator running (dataset mode, 4s)");
  }
  // Cron: simulate threat every 5 min in prod
  cron.schedule("*/5 * * * *", simulateThreatFromDataset);
  // Metrics every minute
  cron.schedule("*/1 * * * *", collectMetrics);
  // Cleanup old metrics daily
  cron.schedule("0 2 * * *", async () => {
    await sequelize
      .query(
        "DELETE FROM system_metrics WHERE recorded_at < DATE_SUB(NOW(), INTERVAL 7 DAY)",
      )
      .catch(() => {});
    await sequelize
      .query(
        "DELETE FROM activity_log WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)",
      )
      .catch(() => {});
    logger.info("🗑  Cleanup complete");
  });
  logger.info("✅ Scheduler started");
};

module.exports = { startJobs };
