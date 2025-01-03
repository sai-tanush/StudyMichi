const Profile = require("../models/Profile");
const User = require("../models/User");
const Course = require("../models/Course");
const CourseProgress = require("../models/CourseProgress");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const { convertSecondsToDuration } = require("../utils/secToDuration");
require("dotenv").config();

//update Profile
exports.updateProfile = async (req, res) => {
	try {
		const { dateOfBirth = "", about = "", contactNumber, gender } = req.body;
		const id = req.user.id;

		// Find the profile by id
		const userDetails = await User.findById(id);
		const profile = await Profile.findById(userDetails.additionalDetails);

		// Update the profile fields
		profile.dateOfBirth = dateOfBirth;
		profile.about = about;
		profile.contactNumber = contactNumber;
    profile.gender = gender;

		// Save the updated profile
		await profile.save();

		return res.json({
			success: true,
			message: "Profile updated successfully",
			profile,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: error.message,
		});
	}
};

//delete Account
exports.deleteAccount = async (req, res) => {
	try {
		const id = req.user.id;
		const user = await User.findById({ _id: id });
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}
		// Delete Assosiated Profile with the User
		await Profile.findByIdAndDelete({ _id: user.additionalDetails });
		// TODO: Unenroll User From All the Enrolled Courses
		// Now Delete User
		await User.findByIdAndDelete({ _id: id });
		res.status(200).json({
			success: true,
			message: "User deleted successfully",
		});
	} catch (error) {
		res
			.status(500)
			.json({ success: false, message: "User Cannot be deleted!" });
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
      message: "User data fetched successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while Fetching all user accounts",
      error: error.message,
    });
  }
};

//update displayPicture of user
exports.updateDisplayPicture = async (req, res) => {
    try {
      const displayPicture = req.files.displayPicture
      const userId = req.user.id
      const image = await uploadImageToCloudinary(
        displayPicture,
        process.env.FOLDER_NAME,
        1000,
        1000
      )
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      )
      res.send({
        success: true,
        message: `Image Updated successfully`,
        data: updatedProfile,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};

//get EnrolledCourses of user
exports.getEnrolledCourses = async (req, res) => {
    try {
      const userId = req.user.id
      let userDetails = await User.findOne({
        _id: userId,
      })
        .populate({
          path: "courses",
          populate: {
            path: "courseContent",
            populate: {
              path: "subSection",
              select: "timeDuration videoUrl description title"
            },
          }
        })
        .exec()

        userDetails = userDetails.toObject()
        var SubsectionLength = 0
        for (var i = 0; i < userDetails.courses.length; i++) {
          let totalDurationInSeconds = 0
          SubsectionLength = 0
          for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
            totalDurationInSeconds += userDetails.courses[i].courseContent[
              j
            ].subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0)
            userDetails.courses[i].totalDuration = convertSecondsToDuration(
              totalDurationInSeconds
            )
            SubsectionLength +=
              userDetails.courses[i].courseContent[j].subSection.length
          }
          let courseProgressCount = await CourseProgress.findOne({
            courseId: userDetails.courses[i]._id,
            userId: userId,
          })
          courseProgressCount = courseProgressCount?.completedVideos.length
          if (SubsectionLength === 0) {
            userDetails.courses[i].progressPercentage = 100
          } else {
            // To make it up to 2 decimal point
            const multiplier = Math.pow(10, 2)
            userDetails.courses[i].progressPercentage =
              Math.round(
                (courseProgressCount / SubsectionLength) * 100 * multiplier
              ) / multiplier
          }
        }
      if (!userDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find user with id: ${userDetails}`,
        })
      }
      return res.status(200).json({
        success: true,
        data: userDetails.courses,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message:"Could not fetch user enrolledCourses"
      })
    }
};

exports.instructorDashboard = async (req, res) => {

    try{
      const courseDetails = await Course.find({
        instructor: req.user.id
      });

      const courseData = courseDetails.map((course) => {
        const totalStudentsEnrolled = course.studentEnrolled.length
        const totalAmountGenerated = totalStudentsEnrolled * course.price;

        //create an new object with the additional fields

        const courseDataWithStats = {
            _id: course._id,
            courseName: course.courseName,
            courseDescription: course.courseDescription,
            totalStudentsEnrolled: totalStudentsEnrolled,
            totalAmountGenerated: totalAmountGenerated,
        }
        return courseDataWithStats
      })



      return res.status(200).json({
        success: true,
        message: "Successfully fetched instructor course details",
        courses: courseData,
      }) 

    }
    catch(error){
      return res.status(500).json({
        success: false,
        message:"Internal Servcer Error",
        error: error.message,
      })
    }
}
  