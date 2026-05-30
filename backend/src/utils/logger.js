const winston = require("winston");
const path = require("path");
const { combine, timestamp, printf, colorize } = winston.format;

const fmt = printf(
  ({ level, message, timestamp }) =>
    `${timestamp} [${level.toUpperCase()}] ${message}`,
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(timestamp({ format: "HH:mm:ss" }), fmt),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: "HH:mm:ss" }), fmt),
    }),
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/app.log"),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/error.log"),
      level: "error",
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

module.exports = logger;
