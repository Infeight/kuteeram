const mongoose = require("mongoose");
const dotenv = require("dotenv").config();

const connectDB = mongoose
  .connect(process.env.MONGOURL)
  .then(() => {
    console.log("Connected to database successfully");
  })
  .catch(() => {
    console.log("Error connecting to database");
    process.exit(1);
  });

module.exports = { connectDB };
