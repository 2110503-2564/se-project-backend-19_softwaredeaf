const Review = require("../models/Review");
exports.getMyReview = async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id && req.user.role != "admin") {
      return res.status(403).json({
        message: "You are not authorized to view these reviews.",
      });
    }

    const myReview = await Review.find({ user: req.params.id })
      .populate({
        path: "user",
        select: "name",
      })
      .populate({
        path: "camp",
        select: "name",
      });

    if (myReview.length == 0 || !myReview) {
      return res.status(400).json({
        message: "No reviews found for this user",
      });
    }

    return res.status(200).json({ success: true, data: myReview });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};

exports.getCampReview = async (req, res, next) => {
  try {
    const campReview = await Review.find({ camp: req.params.id });
    if (campReview.length == 0 || !campReview) {
      return res.status(404).json({
        message: "No reviews found for this camp",
      });
    }

    return res.status(200).json({ success: true, data: campReview });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};

exports.createReview = async (req, res, next) => {
  try {
    const review = await Review.create(req.body);
    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error creating review. Please try again",
    });
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id && req.user.role != "admin") {
      return res.status(403).json({
        message: "You are not authorized to delete this reviews.",
      });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: `Cannot find review`,
      });
    }
    await Review.deleteOne({ _id: req.params.id });
    return res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error deleting review. Please try again",
    });
  }
};

//add by kwan
// @desc Get all reviews with 'username' consist of searchTerm
// @route   GET /api/v1/reviews  (with body {username:searchTerm})
// @access  admin
exports.getUserReports = async (req, res, next) => {
  const searchTerm = req.query.search;

  try {
    const campReview = await Review.find({
      username: { $regex: searchTerm, $options: "i" },status:{reported:true}
    });

    return res.status(200).json({ success: true, data: campReview });
  } 
  catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};
