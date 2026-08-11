const express = require("express");

const { getUnsubscribeInfo, confirmUnsubscribe } = require("../controllers/public.controller");

const router = express.Router();

router.get("/unsubscribe/:token", getUnsubscribeInfo);
router.post("/unsubscribe/:token", confirmUnsubscribe);

module.exports = { publicRouter: router };
