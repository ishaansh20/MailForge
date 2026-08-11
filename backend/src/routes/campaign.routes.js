const express = require("express");

const { authenticate } = require("../middleware/authMiddleware");
const {
  list,
  getById,
  create,
  duplicate,
  update,
  remove,
  send,
  schedule,
  unschedule,
  recipients,
  sendTest,
} = require("../controllers/campaign.controller");

const router = express.Router();

router.use(authenticate);

router.post("/send-test", sendTest);

router.get("/", list);
router.get("/:id", getById);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

router.post("/:id/duplicate", duplicate);
router.post("/:id/send", send);
router.post("/:id/schedule", schedule);
router.post("/:id/unschedule", unschedule);
router.get("/:id/recipients", recipients);

module.exports = { campaignRouter: router };
