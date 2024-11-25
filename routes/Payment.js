const express = require("express");
const router = express.Router();

//import payment controllers
const { capturePayment, verifySignature } = require("../controllers/Payment");

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
router.post("/verifySignature", verifySignature);

module.exports = router;
