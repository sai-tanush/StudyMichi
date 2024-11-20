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
