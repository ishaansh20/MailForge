const mongoose = require("mongoose");

const { env } = require("./env");

async function connectDB() {
  if (!env.mongoUri) {
    throw new Error("MONGODB_URI is not configured");
  }

  await mongoose.connect(env.mongoUri);
  console.log("MongoDB connected");
}

module.exports = { connectDB };
