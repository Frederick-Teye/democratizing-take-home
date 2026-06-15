const registerUser = async (req, res) => {
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
};

const login = async (req, res) => {
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
};
