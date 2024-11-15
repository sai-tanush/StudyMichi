const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");

//createRating
exports.createRating = async (req, res) => {
  try {
    //fetch userId
    const userId = req.user.id;

    //fetch courseId from req.body
    const { rating, review, courseId } = req.body;

    //check if user is enrolled or not
    const courseDetails = await Course.findOne({
      _id: courseId,
      studentsEnrolled: { $eleMatch: { $eq: userId } },
    });
    if (!courseDeatils) {
      return res.status(400).json({
        success: false,
        message: "Student is not enrolled in the course",
      });
    }

    //check if user has already reviewed for the particular course
    const alreadyReviewed = Course.findOne({
      user: userId,
      course: courseId,
    });

    if (alreadyReviewed) {
      return res.status(403).json({
        success: false,
        message: "Course is already reviewed by the user",
      });
    }

    //create a new rating and review
    const ratingReview = await RatingAndReview.create({
      rating,
      review,
      course: courseId,
      user: userId,
    });

    //update course with this new review
    const updatedCourseDetails = await Course.findByIdAndUpdate(
      { _id: courseId },
      {
        $push: {
          ratingAndReview: ratingReview._id,
        },
      },
      { new: true }
    );
    console.log(updatedCourseDetails);

    //return response
    return res.status(200).json({
      success: true,
      message: "Rating and Review created successfully!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not create Rating for this course",
      error: error.message,
    });
  }
};

//getAverageRating

//getAllRating
