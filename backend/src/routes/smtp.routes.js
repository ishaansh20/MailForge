const express = require("express");

const { authenticate } = require("../middleware/authMiddleware");
const {
  list,
  getById,
  create,
  update,
  remove,
  testConnection,
  sendTest,
  setDefault,
  setStatus,
} = require("../controllers/smtp.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", list);
router.get("/:id", getById);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

router.post("/:id/test", testConnection);
router.post("/:id/send-test", sendTest);
router.patch("/:id/default", setDefault);
router.patch("/:id/status", setStatus);

module.exports = { smtpRouter: router };
