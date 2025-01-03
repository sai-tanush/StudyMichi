const mongoose = require("mongoose");
const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const CourseProgress = require("../models/CourseProgress");
const mailSender = require("../utils/mailSender");
const {
  courseEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmail");
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail");
const crypto = require("crypto");

//initiate razorpay order
exports.capturePayment = async(req, res) => {

  const { courses } = req.body;
  const userId = req.user.id;

  if(courses.length === 0){
    return res.status(400).json({
        success: false,
        message: "Please provide course id",
    });
  }

  let totalAmount = 0;

  for(const course_id of courses){
    let course;

    try{
      course = await Course.findById(course_id);
      if(!course){
        return res.status(400).json({
          success: false,
          message: "Could not find the course with this courseId",
        });
      }

      const uid = new mongoose.ObjectId(userId);

      if(course.studentEnrolled.includes(uid)){
        return res.status(200).json({
          success: false,
          message: "Student already enrolled in this course",
        });
      }

      totalAmount += course.price;
    }
    catch(error){
      return res.status(500).json({
        success: false,
        message: "Error while purchasing the course for this student",
        error: error.message,
      })
    }
  }

  const options = {
    amount: totalAmount * 100,
    currency:"INR",
    receipt: Math.random(Date.now()).toString(),
  }

  try{
      const paymentResponse = await instance.orders.create(options);
      return res.status(200).json({
        success: true,
        message: "Order initiated successfully",
        data: paymentResponse,
      });
  }
  catch(error){
    return res.status(500).json({
      success: false,
      message: "Could not initiate order",
      error: error.message,
    });
  }
}

//verify the payment
exports.verifyPayment = async(req, res) => {

  const razorpay_order_id = req.body?.bodyData?.razorpay_order_id;
  const razorpay_payment_id = req.body?.bodyData?.razorpay_payment_id;
  const razorpay_signature = req.body?.bodyData?.razorpay_signature;
  const courses = req.body?.bodyData?.courses;
  const userId = req.user.id;

  if(!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courses || !userId){
    return res.status(400).json({
      success: false,
      message: "All fields required"
    });
  }

  let body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET)
        .update(body.toString())
        .digest("hex");
  
    if(expectedSignature === razorpay_signature){
      //enroll student
      await enrollStudents(courses, userId, res);


      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Payment failed",
    });
}

exports.sendPaymentSuccessEmail = async(req, res) => {

  const { orderId, paymentId, amount } = req.body;

  const userId = req.user.id;

  if(!orderId || !paymentId || !amount || !userId){
    return res.status(400).json({
      success: false,
      message: "Please provide all fields",
    });
  }

  try{
    //find student with userId
    const enrolledStudent = User.findById(userId);
    await mailSender(
      enrolledStudent.email,
      `Payment Received`,
      paymentSuccessEmail(`${enrolledStudent.firstName}`,
        amount/100, orderId, paymentId )
    )
  }
  catch(error){
    return res.status(500).json({
      success: false,
      message: "Could not send email",
    });

  }
}

//enrollStudents function
const enrollStudents = async(courses, userId, res) => {

  if(!courses || !userId){
    return res.status(400).json({
      success: false,
      message: "Please provide courses and userId",
    });
  }

  for(const courseId of courses){

    try{
         //find course and enroll student in it
          const enrolledCourse = await Course.findOneAndUpdate(
            {_id:courseId},
            {$push:{studentEnrolled:userId}},
            {new:true},
          )

          if(!enrolledCourse){
            return res.status(500).json({
              success: false,
              message: "Course not found",
            });
          }

          const courseProgress = await CourseProgress.create({
            courseId: courseId,
            userId: userId,
            completedVideos: [],
          })

          //find students and add their id in the courseDetails
          const enrolledStudent = await User.findByIdAndUpdate(userId,
            {$push:{
              courses: courseId,
              courseProgress: courseProgress._id,
            }},
            {new: true}, 
          );

          //send mail to student
          const emailResponse = await mailSender(
            enrolledStudent.email,
            `Successfully enrolled into ${enrolledCourse.courseName}`,
            courseEnrollmentEmail(enrolledCourse.courseName, `${enrolledStudent.firstName} ${enrolledStudent.lastName}`)
          )
    }
    catch(error){
      return res.status(500).json({
        success: false,
        message:"Course not found",
        error: error.message,
      });
    }   
  }
}
