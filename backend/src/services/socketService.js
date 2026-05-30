const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Auth required"));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id} (${socket.user?.username})`);
    socket.join("threats");
    socket.emit("connected", {
      message: "CyberThreatVision2 live feed active",
      timestamp: new Date().toISOString(),
    });
    socket.on("subscribe", (ch) => {
      if (["threats", "alerts", "metrics"].includes(ch)) socket.join(ch);
    });
    socket.on("disconnect", () =>
      logger.debug(`Socket disconnected: ${socket.id}`),
    );
  });

  logger.info("✅ Socket.IO initialized");
  return io;
};

const emitThreat = (threat) =>
  io
    ?.to("threats")
    .emit("new_threat", { ...threat, timestamp: new Date().toISOString() });
const emitAlert = (alert) =>
  io
    ?.to("alerts")
    .emit("new_alert", { ...alert, timestamp: new Date().toISOString() });
const emitMetrics = (m) => io?.to("metrics").emit("metrics_update", m);
const getIO = () => io;

module.exports = { initSocket, emitThreat, emitAlert, emitMetrics, getIO };
