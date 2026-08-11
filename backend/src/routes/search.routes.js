const express = require("express");

const { authenticate } = require("../middleware/authMiddleware");
const { search } = require("../controllers/search.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", search);

module.exports = { searchRouter: router };
