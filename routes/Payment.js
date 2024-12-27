const express = require("express");
const router = express.Router();

//import payment controllers
const { capturePayment, verifyPayment, sendPaymentSuccessEmail } = require("../controllers/Payment");

//import middlewares
const {
  auth,
  isAdmin,
  isInstructor,
  isStudent,
} = require("../middlewares/auth");

//defining Payment routes --->
router.post("/capturePayment", auth, isStudent, capturePayment);

//verify signature
router.post("/verifyPayment", auth, isStudent, verifyPayment);

//send email after payment
router.post("/sendPaymentSuccessEmail", auth, isStudent, sendPaymentSuccessEmail);

module.exports = router; 
