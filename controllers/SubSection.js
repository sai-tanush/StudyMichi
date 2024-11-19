const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const uploadImageToCloudinary = require("../utils/imageUploader");
require("dotenv").config();

//create a SubSection
exports.createSubSection = async (req, res) => {
  try {
    //fetch data from req.body
    const { sectionId, title, timeDuration, description } = req.body;

    //extract file.video
    const video = req.files.videoFile;

    //validation
    if (!sectionId || !title || !timeDuration || !description || !video) {
      return res.status(400).json({
        succes: false,
        message: "All fields are required",
      });
    }

    //upload video to cloudinary
    const uploadDetails = await uploadImageToCloudinary(
      video,
      process.env.FOLDER_NAME
    );

    //create a new sub-section
    const subSectionDetails = await SubSection.create({
      title: title,
      timeDuration: timeDuration,
      description: description,
      videoUrl: uploadDetails.secure_url,
    });

    //update section with subsection ObjectID
    const updateSection = await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $push: {
          subSection: subSectionDetails._id,
        },
      },
      { new: true }
    ).populate("subSection");

    //return response
    return res.status(200).json({
      success: true,
      message: "SubSection created successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while creating a subsection",
      error: error.message,
    });
  }
};

//update a subSection
exports.updateSubSection = async (req, res) => {
  try {
    //fetch data
    const { title, sectionId, description } = req.body;
    const subSectionId = await SubSection.findById(sectionId);

    //validate data
    if (!subSectionId) {
      return res.status(400).json({
        success: false,
        message: "SubSection ID is required!",
      });
    }

    if (!title || !timeDuration || !description) {
      return res.status(400).json({
        success: false,
        message: "All fields are necessary!",
      });
    }

    //update data
    const updateSubSection = await SubSection.findByIdAndUpdate(
      subSectionId,
      { title, timeDuration, description },
      { new: true }
    );

    if (!updatedSubSection) {
      return res.status(404).json({
        success: false,
        message: "SubSection not found!",
      });
    }

    //return resposne
    return res.status(200).json({
      success: true,
      message: "SubSection updated successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while updating a subsection",
      error: error.message,
    });
  }
};

//delete a subSection
exports.deleteSubSection = async (req, res) => {
  try {
    //fetch data
    const { subSectionId, sectionId } = req.body;
    await Section.findByIdAndUpdate(
      {_id: sectionId },
      {
        $pull: {
          subSection: subSectionId,
        },
      }
    )

    //use findByIdAndDelete
    const subSection =  await SubSection.findByIdAndDelete({_id: subSectionId});

    //validation
    if (!subSection) {
      return res
        .status(404)
        .json({ success: false, message: "SubSection not found" })
    }

    //return response
    return res.status(200).json({
      success: true,
      message: "subsection deleted Successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while creating a subsection",
      error: error.message,
    });
  }
};
