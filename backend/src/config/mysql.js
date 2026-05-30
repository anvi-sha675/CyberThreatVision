const { Sequelize } = require("sequelize");
const logger = require("../utils/logger");

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || "cyberthreatdb2",
  process.env.MYSQL_USER || "root",
  process.env.MYSQL_PASSWORD || "",
  {
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    dialect: "mysql",
    logging: (msg) => logger.debug(`[MySQL] ${msg}`),
    pool: { max: 20, min: 2, acquire: 30000, idle: 10000 },
    define: { timestamps: true, underscored: true, freezeTableName: true },
    timezone: "+00:00",
  },
);

const connectMySQL = async () => {
  try {
    await sequelize.authenticate();
    logger.info("✅ MySQL connected");
  } catch (err) {
    logger.error("❌ MySQL failed:", err.message);
    throw err;
  }
};

module.exports = { sequelize, connectMySQL };
