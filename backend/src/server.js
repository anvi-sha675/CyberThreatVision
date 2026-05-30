require("dotenv").config();
const http = require("http");
const app = require("./app");
const { initSocket } = require("./services/socketService");
const { connectMySQL } = require("./config/mysql");
const logger = require("./utils/logger");
const { startJobs } = require("./services/schedulerService");

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await connectMySQL();
    const server = http.createServer(app);
    initSocket(server);
    startJobs();
    server.listen(PORT, () => {
      logger.info(`🛡  CyberThreatVision2 API  → http://localhost:${PORT}`);
      logger.info(
        `🤖 ML Microservice         → ${process.env.ML_SERVICE_URL || "http://localhost:5001"}`,
      );
      logger.info(
        `📊 Mode: ${process.env.OFFLINE_MODE === "true" ? "OFFLINE (datasets)" : "ONLINE (datasets + optional APIs)"}`,
      );
    });

    const shutdown = async (sig) => {
      logger.info(`${sig} received — shutting down`);
      const { sequelize } = require("./config/mysql");
      await sequelize.close();
      process.exit(0);
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    logger.error("Bootstrap failed:", err);
    process.exit(1);
  }
}

bootstrap();
