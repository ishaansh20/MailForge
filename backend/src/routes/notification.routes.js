const express = require("express");

const { authenticate } = require("../middleware/authMiddleware");
const { list, unreadCount, markRead, markAllRead } = require("../controllers/notification.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", list);
router.get("/unread-count", unreadCount);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markRead);

module.exports = { notificationRouter: router };
