const mongoose = require("mongoose");
const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {
  courseEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmail");

//capture the payment and initaiate the razorpay order
exports.capturePayment = async (req, res) => {
  //get courseId and userId
  const { course_id } = req.body;
  const userId = req.user.id;

  //validation -->
  //--> valid courseId
  if (!course_id) {
    return res.status(400).json({
      success: false,
      message: "Please provide valid course ID",
    });
  }

  //--> valid courseDetail
  let course;
  try {
    course = await Course.findById(course_id);
    if (!course) {
      return res.status(400).json({
        success: false,
        message: "Could not find the course",
      });
    }

    //--> check if user has already purchased/enrolled in the same course
    const uid = new mongoose.Types.ObjectId(userId);
    if (course.studentEnrolled.includes(uid)) {
      return res.status(400).json({
        success: false,
        message: "Student already enrolled in the same course",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }

  //create order
  const amount = course.price;
  const currency = "INR";

  const options = {
    amount: amount * 100,
    currency,
    receipt: Math.random(Date.now()).toString(),
    notes: {
      CourseId: course_id,
      userId,
    },
  };

  try {
    //initiate the payment using razorpay
    const paymentResponse = await instance.orders.create(options);
    console.log(paymentResponse);

    //return response
    return res.status(200).json({
      success: true,
      message: "Enrolled in course successfully",
      courseName: course.courseName,
      courseDescription: course.courseDescription,
      thumbnail: course.thumbnail,
      orderId: paymentResponse.id,
      currency: paymentResponse.currency,
      amount: paymentResponse.amount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Could not initiate order!",
      error: error.message,
    });
  }
};

//verify signature of razorpay and server
exports.verifySignature = async(req, res) => {
    
    const webhookSecret = "123456789";
    const signature = req.headers["x-razorpay-signature"];

    const shasum = crypto.createHmac("sha256", webhookSecret);
    shasum.update = (JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if(signature === digest) {
        console.log("Payment is Authorized");

        const { courseId, userId } = req.body.payload.payment.entity.notes;

        try{    
            //fulfill the action -->

            //--> find the course and enroll the student in it
            const enrolledCourse = await Course.findOneAndUpdate(
                {_id: courseId},
                {$push: {studentEnrolled: userId}},
                {new: true},
            );

            if(!enrolledCourse){
                return res.status(400).json({
                    success: false,
                    message: 'Course not found!',
                });
            }
            console.log(enrolledCourse);

            //--> find the student and add the course to their enrolledCourse list
            const enrolledStudent = User.findOneAndUpdate(
                {_id: userId},
                {$push: {
                    courses: courseId
                }},
                {new: true},
            )

            if(!enrolledStudent) {
                return res.status(400).json({
                    success: false,
                    message: 'Student not found!',
                });
            }

            //send mail for confirmation course enrollment
            const emailResponse = await mailSender(
                enrolledStudent.email,
                "Congratulations from StudyMichi",
                "You are enrolled into new StudyMichi Course",
            );

            console.log(emailResponse);
            
            //return Successful Response
            return res.status(200).json({
                success: true,
                message: 'Couse Purchased & Student enrolled in the same course',
            });
        }catch(error){
            console.error(error);
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
    else{
        return res.status(500).json({
            success: false,
            message: 'Invalid request',
        });
    }
};
