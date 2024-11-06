const mongoose = require("mongoose");
require("dotenv").config();

exports.connect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("DB connected successfully!");
  } catch (err) {
    console.log("DB connection failed!");
    console.error(err);
    process.exit(1);
  }
};
