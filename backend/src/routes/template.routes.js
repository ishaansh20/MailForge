const express = require("express");

const { authenticate } = require("../middleware/authMiddleware");
const { list, getById, create, update, remove } = require("../controllers/template.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", list);
router.get("/:id", getById);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

module.exports = { templateRouter: router };
