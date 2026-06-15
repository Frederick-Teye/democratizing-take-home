const express = require("express");
const app = express();
const authRoutes = require("./routes/auth");
const port = process.env.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
