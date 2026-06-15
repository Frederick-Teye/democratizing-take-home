const express = require("express");
const app = express();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const ACCESS_KEY = process.env.ACCESS_KEY || "accessKey";
const REFRESH_KEY = process.env.REFRESH_KEY || "refreshKey";
const port = process.env.PORT || 8000;
const environment = process.env.environment || "production";

let users = [{ id: 1, username: "user1", password: "password1" }];
let refreshTokens = [];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ msg: "Username and password are required" });
  }

  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ msg: "Username already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  users.push({ username, password: hashedPassword, id: users.length + 1 });

  res.status(201).json({ msg: "User registered successfully" });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = users.find((u) => u.username === username);

  if (!user) {
    return res.status(400).json({ msg: "Invalid credential" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ msg: "Invalid credential" });
  }

  const accessToken = jwt.sign({ username: user.username }, ACCESS_KEY, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ username: user.username }, REFRESH_KEY, {
    expiresIn: "7d",
  });

  refreshTokens.push(refreshToken);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: environment === "production" ? true : false,
    sameSite: environment === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken, msg: "Login successful" });
});

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

app.get("/profile", authenticateJWT, (req, res) => {
  const user = users.find((u) => u.username === req.user);
  res.json({ message: "Profile accessed", user });
});

app.post("/refresh", (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not found" });
  }

  if (!refreshTokens.includes(refreshToken)) {
    return res.status(401).json({ message: "Refresh token invalid" });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_KEY);
    const newAccessToken = jwt.sign({ username: decoded.username }, ACCESS_KEY, {
      expiresIn: "15m",
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ message: "Refresh token expired or invalid" });
  }
});

app.post("/logout", (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  refreshTokens = refreshTokens.filter((token) => token !== refreshToken);

  res.clearCookie("refreshToken");

  res.json({ message: "Logged out successfully" });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
