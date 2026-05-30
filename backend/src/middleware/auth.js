const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer "))
      return res.status(401).json({ error: "No token" });
    const token = auth.split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin")
    return res.status(403).json({ error: "Admin required" });
  next();
};

const requireAnalyst = (req, res, next) => {
  if (!["admin", "analyst"].includes(req.user?.role))
    return res.status(403).json({ error: "Analyst role required" });
  next();
};

module.exports = { authenticate, requireAdmin, requireAnalyst };
