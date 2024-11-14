const Profile = require("../models/Profile");
const User = require("../models/User");

//update Profile
exports.updateProfile = async (req, res) => {
	try {
		const { dateOfBirth = "", about = "", contactNumber } = req.body;
		const id = req.user.id;

		// Find the profile by id
		const userDetails = await User.findById(id);
		const profile = await Profile.findById(userDetails.additionalDetails);

		// Update the profile fields
		profile.dateOfBirth = dateOfBirth;
		profile.about = about;
		profile.contactNumber = contactNumber;

		// Save the updated profile
		await profile.save();

		return res.json({
			success: true,
			message: "Profile updated successfully",
			profile,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			success: false,
			error: error.message,
		});
	}
};

//delete Account

exports.deleteAccount = async (req, res) => {
  try {
    //fetch id
    const id = req.user.id;

    //validate id
    const userDetails = await User.findById(id);
    if (!userDetails) {
      return res.status(500).json({
        success: false,
        message: "User not found",
      });
    }

    //delete profile
    const deleteProfile = await Profile.findByIdAndDelete({
      _id: userDetails.additionalDetails,
    });
    if (!deleteProfile) {
      return res.status(400).json({
        success: false,
        message: "Error delete User Profile",
      });
    }

    //delete user
    await User.findByIdAndDelete({ _id: id });

    //TODO: un-enroll user from all enrolled courses

    //return response
    return res.status(200).json({
      success: true,
      message: "User account deleted successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while Deleting Account",
      error: error.message,
    });
  }
};

//get AllUserDetails
exports.getAllUserDetails = async (req, res) => {
  try {
    //get id
    const id = req.user.id;

    //validation and get user details
    const userDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec();

    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: "User not Found!",
      });
    }

    //return response
    return res.status(200).json({
      success: true,
      message: "Fetched all user details!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while Fetching all user accounts",
      error: error.message,
    });
  }
};
