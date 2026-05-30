const logger = require("../utils/logger");
const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.url} — ${err.message}`);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
module.exports = errorHandler;
