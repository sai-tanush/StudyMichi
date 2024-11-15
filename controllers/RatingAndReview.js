const mongoose = require("mongoose");
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
exports.getAverageRating = async (req, res) => {
  try {
    //fetch courseId
    const courseId = req.body.courseId;

    //calculate avg rating
    const result = await RatingAndReview.aggregate([
      {
        $match: {
          course: new mongoose.Types.ObjectId(courseId),
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    //return rating
    if (result.length > 0) {
      return res.status(200).json({
        success: true,
        averageRating: result[0].averageRating,
      });
    }

    //if no rating/review exist
    return res.status(200).json({
      success: true,
      message:
        "Average rating is 0, no rating/review upload by any enrolled user",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error fetching average Rating of the course",
      error: error.message,
    });
  }
};

//getAllRating
