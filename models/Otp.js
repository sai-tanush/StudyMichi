import mailSender from "../utils/mailSender";
const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    expires: 5 * 60,
  },
});

async function sendVerificationEmail(email, otp) {
  try {
    const mailResponse = await mailSender(
      email,
      "Verification Email from StudyMichi",
      otp
    );
    console.log("Email sent Successfully!", mailResponse);
  } catch (error) {
    console.log("error occurred while sending mail", error.message);
    throw error;
  }
}

otpSchema.pre("save", async function(next) {
    await sendVerificationEmail(this.email, this.otp);
    next();
})

module.exports = mongoose.models("Otp", otpSchema);
