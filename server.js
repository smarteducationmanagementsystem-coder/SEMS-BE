const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const routes = require("./routes");
const { errorHandler } = require("./middlewares/error");

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "SEMS_DB";

const app = express();

app.use(
  cors({
    origin: process.env.NODE_ENV === "production" ? (process.env.CLIENT_ORIGIN || "http://localhost:3000").split(",").map((item) => item.trim()) : true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);
app.use(express.json({ limit: "4mb" }));
app.use("/api", routes);
app.use(errorHandler);

async function start() {
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing in .env");
    process.exit(1);
  }
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is missing in .env");
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });
  app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
    console.log(`Connected to MongoDB database: ${mongoose.connection.name}`);
  });
}

start().catch((error) => {
  console.error("Server failed to start:", error.message);
  process.exit(1);
});
