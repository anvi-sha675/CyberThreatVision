const express = require("express");
const { authenticate } = require("../middleware/auth");
const { getThreats, getLiveFeed } = require("../controllers/threatController");
const threatRouter = express.Router();
threatRouter.use(authenticate);
threatRouter.get("/", getThreats);
threatRouter.get("/live", getLiveFeed);
module.exports = threatRouter;
