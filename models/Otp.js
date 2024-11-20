const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerification");

const OTPSchema = new mongoose.Schema({
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

//Function to send emails
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

//Define a post-save hook to send email after the document has been saved
OTPSchema.pre("save", async function (next) {
  console.log("New document saved to database");

  //Only send an email when new documemt is created
  if (this.isNew) {
    await sendVerificationEmail(this.email, this.otp);
  }
  next();
});

const OTP = mongoose.model("OTP", OTPSchema);

module.exports = OTP;
