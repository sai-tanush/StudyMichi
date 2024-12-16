const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
require("dotenv").config();

//create a SubSection
exports.createSubSection = async (req, res) => {
  try {
    //fetch data from req.body
    const { sectionId, title, description } = req.body;

    //extract file.video
    const video = req.files.video;

    //validation
    if (!sectionId || !title  || !description || !video) {
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
      timeDuration: `${uploadDetails.duration}`,
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

    console.log("updatedSection after creating new SubSection = ", updateSection);

    //return response
    return res.status(200).json({
      success: true,
      message: "SubSection created successfully!",
      data: updateSection
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
    const { title, sectionId, description, subSectionId } = req.body;

    console.log("updateSubSection was called");
    console.log("title = ", title);
    console.log("description = ", description);
    console.log("sectionId = ", sectionId);
    console.log("subSectionId = ", subSectionId);

    if (!title || !sectionId || !description || !subSectionId ) {
      return res.status(400).json({
        success: false,
        message: "All fields are necessary!",
      });
    }

    const subSection = await SubSection.findById(subSectionId);

    //validate data
    if (!subSection) {
      return res.status(400).json({
        success: false,
        message: "SubSection not found! while updateSubSection",
      });
    }

    if (title !== undefined) {
      subSection.title = title
    }

    if (description !== undefined) {
      subSection.description = description
    }

    if (req.files && req.files.video !== undefined) {
      const video = req.files.video
      const uploadDetails = await uploadImageToCloudinary(
        video,
        process.env.FOLDER_NAME
      )
      subSection.videoUrl = uploadDetails.secure_url
      subSection.timeDuration = `${uploadDetails.duration}`
    }

    await subSection.save()


    //update data
    const updatedSection = await Section.findById(sectionId).populate("subSection");

    console.log("updatedSection after updating SubSection = ", updatedSection);

    if (!updatedSection) {
      return res.status(404).json({
        success: false,
        message: "Section not found! while updateSubSection",
      });
    }

    //return resposne
    return res.status(200).json({
      success: true,
      message: "Section updated successfully! after updating Sub-Section",
      data: updatedSection,
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

    if ( !sectionId || !subSectionId ) {
      return res.status(400).json({
        success: false,
        message: "All fields are necessary!",
      });
    }

    const section = await Section.findByIdAndUpdate(
      {_id: sectionId },
      {
        $pull: {
          subSection: subSectionId,
        },
      }
    )

    if(!section){
      return res.status(404).json({
        success: false,
        message: "SectionId not found while deleteSubSection",
      })
    }

    //use findByIdAndDelete
    const subSection =  await SubSection.findByIdAndDelete({_id: subSectionId});

    //validation
    if (!subSection) {
      return res
        .status(404)
        .json({ success: false, message: "SubSection not found" })
    }

    const updatedSection = await Section.findById(sectionId).populate("subSection");
    console.log("updatedSection data after deleting subSection = ", updatedSection);

    //return response
    return res.status(200).json({
      success: true,
      message: "subsection deleted Successfully!",
      data: updatedSection
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while deleting a subsection",
      error: error.message,
    });
  }
};
