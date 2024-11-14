const mongoose = require("mongoose");
import mailSender from "../utils/mailSender";
import emailTemplate from "../mail/templates/emailVerification";

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
    expires: 60 * 5, //The document will automatically be deleted after 5 minutes of its creation time
  },
});

async function sendVerificationEmail(email, otp) {
  try {
    const mailResponse = await mailSender(
      email,
      "Verification Email from StudyMichi",
      emailTemplate(otp)
    );
    console.log("Email sent Successfully!", mailResponse.response);
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
