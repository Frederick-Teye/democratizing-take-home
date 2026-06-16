const express = require("express");
const router = express.Router();

const {
  registerUser,
  login,
  getProfile,
  refreshAccessToken,
  logout,
} = require("../controllers/authController");

const authenticateJWT = require("../middleware/authenticateJWT");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimiter");

const ACCESS_KEY = process.env.ACCESS_KEY || "accessKey";
const REFRESH_KEY = process.env.REFRESH_KEY || "refreshKey";
const environment = process.env.environment || "production";

router.post("/register", registerLimiter, registerUser);

router.post("/login", loginLimiter, login);

router.get("/profile", authenticateJWT, getProfile);

router.post("/refresh", refreshAccessToken);

router.post("/logout", logout);

module.exports = router;
