const express = require("express");
const router = express.Router();

//Import necessary controllers -->

//--> import course controllers
const {
  createCourse,
  getAllCourses,
  getCourseDetails,
} = require("../controllers/Course");

//--> import category controllers
const {
  createCategory,
  getAllCategories,
  categoryPageDetails,
} = require("../controllers/Category");

//--> import section controllers
const {
  createSection,
  updateSection,
  deleteSection,
} = require("../controllers/Section");

//--> import sub-section controllers
const {
  createSubSection,
  updateSubSection,
  deleteSubSection,
} = require("../controllers/SubSection");

//--> import rating controllers
const {
  createRating,
  getAverageRating,
  getAllRating,
} = require("../controllers/RatingAndReview");

//--> import middlewares
const {
  auth,
  isAdmin,
  isInstructor,
  isStudent,
} = require("../middlewares/auth");

//Course routes---> { courses operations ->  can only be created by Instructors }

//Adding a course
router.post("/createCourse", auth, isInstructor, createCourse);

//Add a section to course
router.post("/addSection", auth, isInstructor, createSection);

//Update a Section
router.post("/updateSection", auth, isInstructor, updateSection);

//Delete a section
router.post("/deleteSection", auth, isInstructor, deleteSection);

//Update sub-section
router.post("/updateSubSection", auth, isInstructor, updateSubSection);

//Delete sub-section
router.post("/deleteSubSection", auth, isInstructor, deleteSubSection);

//create sub-section --> adding a subsection to a section
router.post("/addSubSection", auth, isInstructor, createSubSection);

//get all registered courses
router.get("/getAllCourses", getAllCourses);

//get details of specific courses
router.get("/getCourseDetails", getCourseDetails);

//Category routes---> ( Categories operations can only be done by Admin )

//create category
router.post("/createCategory", auth, isAdmin, createCategory);

//show all the categories available
router.get("/showAllCategories", getAllCategories);

//get details of specific category
router.post("/getCategoryPageDetails", categoryPageDetails);

//Rating and Review routes --->

//create rating
router.post("/createRating", auth, isStudent, createRating);

//get average rating
router.get("/getAverageRating", getAverageRating);

//get all the reviews
router.get("/getReviews", getAllRating);

module.exports = router;
