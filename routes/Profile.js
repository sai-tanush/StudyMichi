const express = require("express");
const router = express.Router();

//import profile controllers
const {
  updateProfile,
  deleteAccount,
  getALlUserDetails,
  updateDisplayPicture,
  getEnrolledCourses,
} = require("../controllers/Profile");

//import middleware
const { auth } = require("../middlewares/auth");
