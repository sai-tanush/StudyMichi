const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
require("dotenv").config();

//create a SubSection

exports.createSubsection = async (req, res) => {
  try {
    //fetch data from req.body
    const { sectionId, title, timeDuration, description } = req.body;

    //extract file.video
    const video = req.files.videoFile;

    //validation
    if (!sectionId || !title || !timeDuration || !description) {
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

    //create a subsection
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
    );
    //HW: log updated section here, after adding populate query

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
