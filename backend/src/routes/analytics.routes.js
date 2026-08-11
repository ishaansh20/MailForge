const express = require("express");

const { authenticate } = require("../middleware/authMiddleware");
const {
  overview,
  sendsOverTime,
  topCampaigns,
  trends,
  subscriberGrowth,
} = require("../controllers/analytics.controller");

const router = express.Router();

router.use(authenticate);

router.get("/overview", overview);
router.get("/sends-over-time", sendsOverTime);
router.get("/top-campaigns", topCampaigns);
router.get("/trends", trends);
router.get("/subscriber-growth", subscriberGrowth);

module.exports = { analyticsRouter: router };
