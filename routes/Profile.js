const express = require("express");
const router = express.Router();

//import profile controllers
const {
  updateProfile,
  deleteAccount,
  getAllUserDetails,
  updateDisplayPicture,
  getEnrolledCourses,
} = require("../controllers/Profile");

//import middleware
const { auth } = require("../middlewares/auth");

//Defining profile routes --->

//Delete user account
router.delete("/deleteProfile", deleteAccount);

//update Profile details
router.put("/updateProfile", auth, updateProfile);

//get user details
router.get("/getUserDetails", auth, getAllUserDetails);

//get enrolled courses
router.get("/getEnrolledCourses", auth, getEnrolledCourses);

//update display picture
router.put("/updateDisplayPicture", auth, updateDisplayPicture);

module.exports = router;
