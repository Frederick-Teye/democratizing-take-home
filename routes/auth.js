const express = require("express");
const router = express.Router();

const {
  registerUser,
  login,
  getProfile,
  refreshAccessToken,
  logout,
} = require("../controllers/authController");

const ACCESS_KEY = process.env.ACCESS_KEY || "accessKey";
const REFRESH_KEY = process.env.REFRESH_KEY || "refreshKey";
const environment = process.env.environment || "production";

router.post("/register", registerUser);

router.post("/login", login);

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  // Extract token from "Bearer <token>"
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, ACCESS_KEY);

    // Attach user to request
    req.user = decoded.username;

    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

router.get("/profile", authenticateJWT, getProfile);

router.post("/refresh", refreshAccessToken);

router.post("/logout", logout);

module.exports = router;
