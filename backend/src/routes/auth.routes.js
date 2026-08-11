const express = require("express");

const { authenticate } = require("../middleware/authMiddleware");
const {
  register,
  login,
  me,
  logout,
  updateMe,
  updateMyPassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me", authenticate, me);
router.put("/me", authenticate, updateMe);
router.put("/me/password", authenticate, updateMyPassword);
router.post("/logout", authenticate, logout);

module.exports = { authRouter: router };
