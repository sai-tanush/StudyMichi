const user = require("../models/User");
const OTP = require("../models/");
const otpGenerator = require("otp-generator");

//send OTP
exports.sendOtp = async (req, res) => {
  try {
    //fetch email from request.body
    const { email, body } = req.body;

    //check if user already exists
    const checkUserPresent = await User.findOne({ email });

    //if user already exists , then return a response
    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: "User already registered",
      });
    }

    //generate OTP
    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    console.log("OTP generated successfully! = ", otp);

    //check if otp is unique or not
    const result = await OTP.findOne({ otp: otp });

    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({ otp: otp });
    }

    const otpPayload = { email, otp };

    //create entry for OTP in DB
    const otpBody = await OTP.create(otpPayload);
    console.log(otpBody);

    //return successfull response
    res.status(200).json({
        success: true,
        message: 'OTP Sent Successfully!',
        otp,
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
        success: false,
        message: error.message, 
    })
  }

  //isAdmin

  //isInstructor

  //isStudent
};
