const express = require("express");

const { authenticate } = require("../middleware/authMiddleware");
const {
  list,
  getById,
  create,
  update,
  remove,
  setStatus,
  importCsv,
} = require("../controllers/contact.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", list);
router.get("/:id", getById);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

router.post("/import", importCsv);
router.patch("/:id/status", setStatus);

module.exports = { contactRouter: router };
