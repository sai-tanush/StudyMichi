const Section = require("../models/Section");
const Course = require("../models/Course");

//create a new section
exports.createSection = async (req, res) => {
  try {
    //fetch data
    const { sectionName, courseId } = req.body;

    //validate data
    if (!sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    //create section
    const newSection = await Section.create({ sectionName });

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
    const { sectionName, sectionId } = req.body;

    //validate data
    if (!sectionName || !sectionId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    //update data
    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      { sectionName },
      { new: true }
    );

    //return response
    return res.status(200).json({
      success: true,
      message: "Section updated successfully!",
      updateCourseDetails,
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
    const { sectionId } = req.params;

    //user findByIdAndDelete
    await Section.findByIdAndDelete(sectionId);

    //return resposnse
    return res.status(200).json({
      success: true,
      message: "Section deleted Successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while deleting section, Please try again!",
      error: error.message,
    });
  }
};
