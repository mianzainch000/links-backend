const mongoose = require("mongoose");
require("dotenv").config();
const dbURI = process.env.MONGO_URI;
mongoose.connect(dbURI);
