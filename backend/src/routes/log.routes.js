const express = require("express");

const { authenticate } = require("../middleware/authMiddleware");
const { list, stats } = require("../controllers/log.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", list);
router.get("/stats", stats);

module.exports = { logRouter: router };
