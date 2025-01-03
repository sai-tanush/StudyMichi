const mongoose = require("mongoose");
const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");

//createRating
exports.createRating = async (req, res) => {
  try {
    //get user id
    const userId = req.user.id;
    //fetchdata from req body
    const { courseId, rating, review } = req.body.data;

    const onlyCourseDetails = await Course.findById(courseId);

    //check if user is enrolled or not
    const courseDetails = await Course.findOne({
      _id: courseId,
      studentEnrolled: { $elemMatch: { $eq: userId } },
    });

    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "Student is not enrolled in the course",
      });
    }
    //check if user already reviewed the course
    const alreadyReviewed = await RatingAndReview.findOne({
      user: userId,
      course: courseId,
    });
    if (alreadyReviewed) {
      return res.status(403).json({
        success: false,
        message: "Course is already reviewed by the user",
      });
    }
    //create rating and review
    const ratingReview = await RatingAndReview.create({
      rating,
      review,
      course: courseId,
      user: userId,
    });

    //update course with this rating/review
    const updatedCourseDetails = await Course.findByIdAndUpdate(
      { _id: courseId },
      {
        $push: {
          ratingAndReviews: ratingReview._id,
        },
      },
      { new: true }
    );
    //return response
    return res.status(200).json({
      success: true,
      message: "Rating and Review created Successfully",
      ratingReview,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
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
    return res.status(500).json({
      success: false,
      message: "Error fetching average Rating of the course",
      error: error.message,
    });
  }
};

//getAllRatingAndReviews
exports.getAllRating = async (req, res) => {
  try {
    const allRatings = await RatingAndReview.find({})
      .sort({ rating: "desc" })
      .populate({
        path: "user",
        select: "firstName lastName email image",
      })
      .populate({
        path: "course",
        select: "courseName",
      })
      .exec();

    if (!allRatings) {
      return res.status(400).json({
        success: false,
        message: "No Ratings Found",
      });
    }

    //return response
    return res.status(200).json({
      success: true,
      message: "All ratings fetched successfully!",
      data: allRatings,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      messsage: "Error while fetching all ratings",
      error: error.message,
    });
  }
};
