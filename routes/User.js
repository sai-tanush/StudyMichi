const express = require("express");
const router = express.Router();

//import auth controllers
const { sendOtp, signUp, login, changePassword } = require("../controllers/Auth");

//import reset Password controllers
const { resetPasswordToken, resetPassword } = required("../controllers/ResetPassword.js");

//import middlewares
const { auth } = required("../middlewares/auth.js");

