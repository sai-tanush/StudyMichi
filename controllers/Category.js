const Category = require("../models/Category");

//Create handler function for categories
exports.createCategory = async (req, res) => {
  try {
    //fetch data
    const { name, description } = req.body;

    //validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    //create entry in DB
    const categoryDetails = await Category.create({
      name: name,
      description: description,
    });
    console.log(categoryDetails);

    //return response
    return res.status(200).json({
      success: true,
      message: "Category created successfully!",
    });
  } catch (error) {
    console.log(error);
    return res(500).json({
      success: false,
      message: "Error while creating Category",
    });
  }
};

//getAllCategories handler function
exports.showAllCategories = async (req, res) => {
  try {
    //fetch all Categories
    const allCategories = await Category.find({}, { name: true, description: true });
    res.status(200).json({
      success: true,
      message: "All Categories fetched successfully",
      allCategories,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: true,
      message: "Error while fetching data",
    });
  }
};
