const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");
const requestLogger = require("./middleware/requestLogger");

// Routes
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const threatRoutes = require("./routes/threats");
const scanRoutes = require("./routes/scan");
const alertRoutes = require("./routes/alerts");
const logsRoutes = require("./routes/logs");
const adminRoutes = require("./routes/admin");
const datasetRoutes = require("./routes/datasets");
const metricsRoutes = require("./routes/metrics");
const networkRoutes = require("./routes/network");

const app = express();

app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(compression());
app.use(
  morgan("combined", {
    stream: { write: (m) => logger.http(m.trim()) },
    skip: (r) => r.url === "/health",
  }),
);
app.use(requestLogger);
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.get("/health", (req, res) =>
  res.json({ status: "ok", service: "CyberThreatVision2", version: "2.0.0" }),
);

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/threats", threatRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/datasets", datasetRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/network", networkRoutes);

app.use((req, res) =>
  res.status(404).json({ error: "Not found", path: req.originalUrl }),
);
app.use(errorHandler);

module.exports = app;
