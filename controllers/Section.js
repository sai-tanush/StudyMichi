const Section = require("../models/Section");
const Course = require("../models/Course");
const SubSection = require("../models/SubSection");

//create a new section
exports.createSection = async (req, res) => {
  try {
    //fetch data
    const { sectionName, courseId } = req.body;

    console.log("sectionName = ", sectionName);
    console.log("courseId = ", courseId);

    //validate data
    if (!sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    //create section
    const newSection = await Section.create({ sectionName });
    console.log("New Section = ", newSection);

    //update course with section objectID
    const updateCourseDetails = await Course.findByIdAndUpdate(
      courseId,
      {
        $push: {
          courseContent: newSection._id,
        },
      },
      { new: true }
    )
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();

    console.log(
      "Updated CourseDetails after creating Section = ",
      updateCourseDetails
    );

    //return response
    return res.status(200).json({
      success: true,
      message: "Created a new section successfully!",
      updateCourseDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while creating Section",
      error: error.message,
    });
  }
};

//update a section
exports.updateSection = async (req, res) => {
  try {
    //fetch data
    const { sectionName, sectionId, courseId } = req.body
    

    //validate data
    if (!sectionName || !sectionId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required in updateSection",
      });
    }

    //update data
    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      { sectionName },
      { new: true }
    );

    console.log(" details after updating Section = ", updatedSection);

    const updatedCourse = await Course.findById(courseId)
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();

    console.log(" updatedCourse after updating Course  = ", updatedCourse);

    //return response
    return res.status(200).json({
      success: true,
      message: "Section updated successfully!",
      data: updatedCourse,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while updating section",
      error: error.message,
    });
  }
};

//delete a section
exports.deleteSection = async (req, res) => {
  try {
    //fetch data
    const { sectionId, courseId } = req.body;

    const course = await Course.findByIdAndUpdate(courseId, {
      $pull: {
        courseContent: sectionId,
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not Found while deleting Section",
      });
    }

    //user findByIdAndDelete
    const section = await Section.findByIdAndDelete(sectionId);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not Found while deleting Section",
      });
    }

    //delete sub-section if section has some
    await SubSection.deleteMany({ _id: { $in: section.subSection } });

    await Section.findByIdAndDelete(sectionId);

    //find the updated course and return
    const updatedCourseDetails = await Course.findById(courseId)
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();

    console.log(
      " updated courseDetails after deleting a section = ",
      updatedCourseDetails
    );

    //return resposnse
    return res.status(200).json({
      success: true,
      message: "Section deleted Successfully!",
      data: updatedCourseDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while deleting section, Please try again!",
      error: error.message,
    });
  }
};
