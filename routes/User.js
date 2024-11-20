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
const { resetPasswordToken, resetPassword } = required(
  "../controllers/ResetPassword.js"
);

//import middlewares
const { auth } = required("../middlewares/auth.js");

//Routes for Login, SignUp and Authentication --->

//Authentication Routes -->

//user login
router.post("/login", login);

//user signup
router.post("/signup", signup);

//send otp
router.post("/sendotp", sendotp);

//Reset-Password -->

//change password
router.post("/changepassword", auth, resetPasswordToken);

//reset-password
router.post("/reset-password", resetPassword);

module.exports = router;
