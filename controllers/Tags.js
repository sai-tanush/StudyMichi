const tag = require("../models/Tags");

//Create handler function for tags
exports.createTag = async (req, res) => {
  try {
    //fetch data
    const { name, description } = req.body;

    //validation
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    //create entry in DB
    const tagDetails = await Tag.create({
      name: name,
      description: description,
    });
    console.log(tagDetails);

    //return response
    return res.status(200).json({
      success: true,
      message: "Tag created successfully!",
    });
  } catch (error) {
    console.log(error);
    return res(500).json({
      success: false,
      message: "Error while creating tags",
    });
  }
};

//getAlltags handler function
exports.showAllTags = async (req, res) => {
  try {
    //fetch all tags
    const allTags = await Tag.find({}, { name: true, description: true });
    res.status(200).json({
      success: true,
      message: "All Tags fetched successfully",
      allTags,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: true,
      message: "Error while fetching data",
    });
  }
};
