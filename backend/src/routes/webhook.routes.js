const express = require("express");
const rateLimit = require("express-rate-limit");

const { brevoEvent } = require("../controllers/webhook.controller");

const router = express.Router();

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/brevo/:secretToken", webhookLimiter, brevoEvent);

module.exports = { webhookRouter: router };
