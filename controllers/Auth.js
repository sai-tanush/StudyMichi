const User = require("../models/User");
const OTP = require("../models/");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailSender = require("../utils/mailSender");
require("dotenv").config();

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

//login
exports,
  (logn = async (req, res) => {
    try {
      //fetch data from request.body
      const { email, password } = req.body;

      //validate data
      if (!email || !password) {
        return res.status(403).json({
          success: false,
          message: "All fields are necessary! Please Retry",
        });
      }

      //check if user exists or not
      const user = await User.findOne({ email }).populate("additionalDetails");
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User is not registered!, please register first!",
        });
      }

      //generate JWT, after password matching
      if (await bcrypt.compare(password, user.password)) {
        const payload = {
          email: user.email,
          id: user._id,
          role: user.accountType,
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: "2h",
        });
        user.token = token;
        user.password = undefined;

        //create cookie and send response
        const options = {
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
          httpOnly: true,
        };
        res.cookie("token", token, options).status(200).json({
          success: true,
          token,
          user,
          message: "User Logged in successfully!",
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "Passwords is incorrect",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Login failure, Please try again!",
      });
    }
  });

//change Password
exports.changePassword = async (req, res) => {
  try {
    //fetch data from body
    const { email, oldPassword, newPassword, confirmNewPassword } =
      req.body;

    //validation
    if (!email || !oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(403).json({
        success: false,
        message: "All fields are necessary! Please Retry",
      });
    }

    const user = User.findOne({ email });
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "User not registered, please register first!",
      });
    }

    const passwordMatch = await bcrypt.compare(user.password, oldPassword);
    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password do not match",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).status({
        success: false,
        message: "New passowords do not match",
      });
    }

    //update password in DB
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await User.updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );
    console.log("Password updated successfully!");

    //send mail- password Updated
    const emailTitle = "Password Update Notification";
    const emailBody = `
            <h1>Password Updated</h1>
            <p>Hello,</p>
            <p>Your password has been successfully updated. If you did not make this change, please contact support immediately.</p>
            <p>Best Regards, <br> StudyMichi Inc</p>`;

    // Send the email notification
    await mailSender(email, emailTitle, emailBody);
    console.log("Password updation email sent successfully!");

    //return response
    return res.status(200).json({
      success: true,
      message: "Password updated successfully !",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Cannot change password!",
    });
  }
};
