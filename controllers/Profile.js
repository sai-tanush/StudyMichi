const Profile = require("../models/Profile");
const User = require("../models/User");

//update Profile
exports.updateProfile = async (req, res) => {
  try {
    //fetch data
    const { dateOfBirth = "", about = "", contactNumber, gender } = req.body;

    //get userId
    const id = req.user.id;

    //validate data
    if (!contactNumber || !gender || !id) {
      return res.status(400).json({
        success: false,
        message: "All fields are required!",
      });
    }

    //find profile
    const userDetails = await User.findById(id);
    const profileId = userDetails.additionalDetails;
    const profileDetails = await Profile.findById(profileId);

    //update profile
    profileDetails.dateOfBirth = dateOfBirth;
    profileDetails.about = about;
    profileDetails.gender = gender;
    profileDetails.contactNumber = contactNumber;
    await profileDetails.save();

    //return response
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      profileDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while updating Profile",
      error: error.message,
    });
  }
};
