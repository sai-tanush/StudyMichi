const User = require("../models/User");
const OTP = require("../models/");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");

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
      message: "OTP Sent Successfully!",
      otp,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }

  //signUp

  exports.signUp = async (req, res) => {
    try {
      //fetch data from request.body
      const {
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        accountType,
        contactNumber,
        otp,
      } = req.body;

      //validate
      if (
        !firstName ||
        !lastName ||
        !email ||
        !password ||
        !confirmPassword ||
        !otp
      ) {
        return res.status(403).json({
          success: false,
          message: "All fields are required",
        });
      }

      //match both the entered passwords
      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "Passwords do not match, Please retry!",
        });
      }

      //check if user already exists in DB
      const existingUser = User.findOne({ email });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already regstered!",
        });
      }

      //find the most recent OTP stored in DB
      const recentOtp = OTP.findOne({ email }).sort({ createdAt: -1 }).limit(1);
      console.log("Recent OTP of User = ", recentOtp);

      //validate OTP
      if (recentOtp.length == 0) {
        //OTP not found
        return res.status(400).json({
          success: false,
          message: "OTP not found!",
        });
      } else if (otp !== recentOtp) {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP",
        });
      }

      //Hash Password
      const hashedPassword = await bcrypt.hash(password, 10);

      //create entry in DB

      const profileDetails = await Profile.create({
        gender: null,
        dateOfBirth: null,
        abiut: null,
        contactNumber: null,
      });

      const user = await User.create({
        firstName,
        lastName,
        email,
        contactNumber,
        password: hashedPassword,
        accountType,
        additionalDetails: profileDetails._id,
        image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
      });

      //return res
      return res.status(200).json({
        success: true,
        messasge: "User registered successfully!",
        user,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "User cannot be registered, please try again!",
      });
    }
  };
};
