const express = require("express");
const router = express.Router();

//import auth controllers
const {
  sendOtp,
  signUp,
  login,
  changePassword,
} = require("../controllers/Auth");

//import reset Password controllers
const {
  resetPasswordToken,
  resetPassword,
} = require("../controllers/ResetPassword.js");

//import middlewares
const { auth } = require("../middlewares/auth.js");

//Routes for Login, SignUp and Authentication --->

//Authentication Routes -->

//user login
router.post("/login", login);

//user signup
router.post("/signup", signUp);

//send otp
router.post("/sendotp", sendOtp);

//Reset-Password -->

//change password
router.post("/reset-password-token", auth, resetPasswordToken);

//reset-password
router.post("/reset-password", resetPassword);

module.exports = router;
