require("dotenv").config();
const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
const userRoutes = require("./routes/user");

const app = express();
app.use(express.json());
app.use(cors());

app.use("/", userRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

module.exports = app;
module.exports.handler = serverless(app);
const PORT = process.env.PORT || 3000; // Fallback for local development



app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
