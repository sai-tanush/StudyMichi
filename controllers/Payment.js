const mongoose = require("mongoose");
const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
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
      console.log(error);
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
    console.log(error);
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

  console.log("req.body in verifyPayment = ", req.body);
  console.log("userId in verifyPayment = ", userId);

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

  console.log("req.body in sendPaymentSuccessEmail = ", req.body);
  console.log("userId in sendPaymentSuccessEmail = ", userId);

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
    console.log("Error in sending email", error);
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
            {$push:{studentsEnrolled:userId}},
            {new:true},
          )

          if(!enrolledCourse){
            return res.status(500).json({
              success: false,
              message: "Course not found",
            });
          }

          //find students and add their id in the courseDetails
          const enrolledStudent = await User.findByIdAndUpdate(userId,
            {$push:{
              courses: courseId
            }},
            {new: true}, 
          );

          //send mail to student
          const emailResponse = await mailSender(
            enrolledStudent.email,
            `Successfully enrolled into ${enrolledCourse.courseName}`,
            courseEnrollmentEmail(enrolledCourse.courseName, `${enrolledStudent.firstName} ${enrolledStudent.lastName}`)
          )
          console.log("Email sent successfully!", emailResponse.response);
    }
    catch(error){
      console.log(error);
      return res.status(500).json({
        success: false,
        message:"Course not found",
        error: error.message,
      });
    }   
  }
}

// //capture the payment and initiate the razorpay order
// exports.capturePayment = async (req, res) => {
//   //get courseId and userId
//   const { course_id } = req.body;
//   const userId = req.user.id;

//   //validation -->
//   //--> valid courseId
//   if (!course_id) {
//     return res.status(400).json({
//       success: false,
//       message: "Please provide valid course ID",
//     });
//   }

//   //--> valid courseDetail
//   let course;
//   try {
//     course = await Course.findById(course_id);
//     if (!course) {
//       return res.status(400).json({
//         success: false,
//         message: "Could not find the course",
//       });
//     }

//     //--> check if user has already purchased/enrolled in the same course
//     const uid = new mongoose.Types.ObjectId(userId);
//     if (course.studentEnrolled.includes(uid)) {
//       return res.status(400).json({
//         success: false,
//         message: "Student already enrolled in the same course",
//       });
//     }
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }

//   //create order
//   const amount = course.price;
//   const currency = "INR";

//   const options = {
//     amount: amount * 100,
//     currency,
//     receipt: Math.random(Date.now()).toString(),
//     notes: {
//       CourseId: course_id,
//       userId,
//     },
//   };

//   try {
//     //initiate the payment using razorpay
//     const paymentResponse = await instance.orders.create(options);
//     console.log(paymentResponse);

//     //return response
//     return res.status(200).json({
//       success: true,
//       message: "Enrolled in course successfully",
//       courseName: course.courseName,
//       courseDescription: course.courseDescription,
//       thumbnail: course.thumbnail,
//       orderId: paymentResponse.id,
//       currency: paymentResponse.currency,
//       amount: paymentResponse.amount,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "Could not initiate order!",
//       error: error.message,
//     });
//   }
// };

// //verify signature of razorpay and server
// exports.verifySignature = async(req, res) => {
    
//     const webhookSecret = "123456789";
//     const signature = req.headers["x-razorpay-signature"];

//     const shasum = crypto.createHmac("sha256", webhookSecret);
//     shasum.update = (JSON.stringify(req.body));
//     const digest = shasum.digest("hex");

//     if(signature === digest) {
//         console.log("Payment is Authorized");

//         const { courseId, userId } = req.body.payload.payment.entity.notes;

//         try{    
//             //fulfill the action -->

//             //--> find the course and enroll the student in it
//             const enrolledCourse = await Course.findOneAndUpdate(
//                 {_id: courseId},
//                 {$push: {studentEnrolled: userId}},
//                 {new: true},
//             );

//             if(!enrolledCourse){
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Course not found!',
//                 });
//             }
//             console.log(enrolledCourse);

//             //--> find the student and add the course to their enrolledCourse list
//             const enrolledStudent = User.findOneAndUpdate(
//                 {_id: userId},
//                 {$push: {
//                     courses: courseId
//                 }},
//                 {new: true},
//             )

//             if(!enrolledStudent) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Student not found!',
//                 });
//             }

//             //send mail for confirmation course enrollment
//             const emailResponse = await mailSender(
//                 enrolledStudent.email,
//                 "Congratulations from StudyMichi",
//                 "You are enrolled into new StudyMichi Course",
//             );

//             console.log(emailResponse);
            
//             //return Successful Response
//             return res.status(200).json({
//                 success: true,
//                 message: 'Couse Purchased & Student enrolled in the same course',
//             });
//         }catch(error){
//             console.error(error);
//             return res.status(500).json({
//                 success: false,
//                 message: error.message,
//             });
//         }
//     }
//     else{
//         return res.status(500).json({
//             success: false,
//             message: 'Invalid request',
//         });
//     }
// };
