const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ACCESS_KEY = process.env.ACCESS_KEY || "accessKey";
const REFRESH_KEY = process.env.REFRESH_KEY || "refreshKey";
const environment = process.env.environment || "production";

let users = [{ id: 1, username: "user1", password: "password1" }];
let refreshTokens = [];

// @desc    Register user
// @route   POST /api/auth/register
const registerUser = async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    const error = new Error("Username and password are required");
    error.status = 400;
    return next(error);
  }

  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ msg: "Username already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  users.push({ username, password: hashedPassword, id: users.length + 1 });

  res.status(201).json({ msg: "User registered successfully" });
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  const { username, password } = req.body;

  const user = users.find((u) => u.username === username);

  if (!user) {
    const error = new Error("Invalid credential");
    error.status = 400;
    return next(error);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error("Invalid credential");
    error.status = 400;
    return next(error);
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
};

// @desc    Get user profile
// @route   GET /api/auth/profile
const getProfile = (req, res, next) => {
  const user = users.find((u) => u.username === req.user);
  res.json({ message: "Profile accessed", user });
};

// @desc    Get new access token for user
// @route   POST /api/auth/refresh
const refreshAccessToken = (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    const error = new Error("Refresh token not found");
    error.status = 401;
    return next(error);
  }

  if (!refreshTokens.includes(refreshToken)) {
    const error = new Error("Refresh token invalid");
    error.status = 401;
    return next(error);
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_KEY);
    const newAccessToken = jwt.sign(
      { username: decoded.username },
      ACCESS_KEY,
      {
        expiresIn: "15m",
      },
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    const error = new Error("Refresh token expired or invalid");
    error.status = 401;
    return next(error);
  }
};

// @desc    Log user out
// @route   GET /api/auth/logout
const logout = (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  refreshTokens = refreshTokens.filter((token) => token !== refreshToken);

  res.clearCookie("refreshToken");

  res.json({ message: "Logged out successfully" });
};

module.exports = {
  registerUser,
  login,
  getProfile,
  refreshAccessToken,
  logout,
};
