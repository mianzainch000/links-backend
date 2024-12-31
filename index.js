require("./db/config");
require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());
const cors = require("cors");
app.use(cors());
app.use((req, res, next) => {
    res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal Server Error" });
});

const userRoutes = require("./routes/user");

app.use("/", userRoutes);

const PORT = process.env.PORT;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
