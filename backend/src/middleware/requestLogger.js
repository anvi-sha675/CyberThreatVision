const { sequelize } = require("../config/mysql");
const SKIP = ["/health", "/api/metrics/ping"];
const requestLogger = async (req, res, next) => {
  if (SKIP.includes(req.path)) return next();
  const start = Date.now();
  const origSend = res.send.bind(res);
  res.send = function (body) {
    const ms = Date.now() - start;
    if (req.path.startsWith("/api/")) {
      setImmediate(async () => {
        try {
          await sequelize.query(
            `INSERT INTO activity_log (user_id,username,action,resource,ip_address,details,status) VALUES (?,?,?,?,?,?,?)`,
            {
              replacements: [
                req.user?.id || null,
                req.user?.username || "anonymous",
                req.method,
                req.path,
                req.ip,
                JSON.stringify({ ms, status: res.statusCode }),
                res.statusCode < 400 ? "success" : "failure",
              ],
            },
          );
        } catch {}
      });
    }
    return origSend(body);
  };
  next();
};
module.exports = requestLogger;
