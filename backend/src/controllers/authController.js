const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sequelize } = require("../config/mysql");
const logger = require("../utils/logger");

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Username and password required" });

    const [users] = await sequelize.query(
      "SELECT id,username,email,password_hash,role,clearance,is_active FROM users WHERE username=? LIMIT 1",
      { replacements: [username] },
    );
    const user = users[0];
    if (!user || !user.is_active)
      return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        clearance: user.clearance,
      },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" },
    );

    await sequelize.query("UPDATE users SET last_login=NOW() WHERE id=?", {
      replacements: [user.id],
    });
    await sequelize.query(
      "INSERT INTO activity_log (user_id,username,action,ip_address,status) VALUES (?,?,'LOGIN',?,'success')",
      { replacements: [user.id, user.username, req.ip] },
    );

    logger.info(`User ${user.username} logged in`);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        clearance: user.clearance,
      },
    });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res) => {
  await sequelize
    .query(
      "INSERT INTO activity_log (user_id,username,action,ip_address) VALUES (?,?,'LOGOUT',?)",
      { replacements: [req.user?.id, req.user?.username, req.ip] },
    )
    .catch(() => {});
  res.json({ message: "Logged out" });
};

const me = (req, res) => res.json({ user: req.user });

module.exports = { login, logout, me };
