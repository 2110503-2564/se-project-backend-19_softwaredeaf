const Review = require("../models/Review");
const Camp = require("../models/Camp.js")
const {
  generateFileName,
  uploadFile,
  getObjectSignedUrl,
  deleteFile,
} = require("./s3.js");

// @desc Get all reviews of the user with the given ID
// @route   GET /api/v1/userreviews/:id
// @access  Private
exports.getMyReview = async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id && req.user.role != "admin") {
      return res.status(403).json({
        message: "You are not authorized to view these reviews.",
      });
    }

    const myReview = await Review.find()
      .populate({
        path: "userId",
        select: "name",
      })
      .populate({
        path: "campgroundId",
        select: "name",
      });

    if (myReview.length == 0) {
      return res.status(400).json({
        message: "No reviews found for this user",
      });
    }

    // for (let eachReview of myReview.data) {
    //   if (
    //     eachReview.pictures &&
    //     !eachCampground.pictures[0].startsWith("http")
    //   ) {
    //     let pictures = [];
    //     for (let eachImage of eachReview.pictures) {
    //       const urlPicture = await getObjectSignedUrl(eachImage);
    //       pictures.push(urlPicture);
    //     }
    //     eachReview.pictures = pictures;
    //   }
    // }

    return res.status(200).json({ success: true, data: myReview });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// @desc Get all reviews of the camp with the given ID
// @route   GET /api/v1/campreviews/:id
// @access  Public
exports.getCampReview = async (req, res, next) => {
  try {
    const campReview = await Review.find({ campgroundId: req.params.id });
    if (campReview.length == 0 || !campReview) {
      return res.status(404).json({
        message: "No reviews found for this camp",
      });
    }

    // for (let eachReview of campReview.data) {
    //   if (
    //     eachReview.pictures &&
    //     !eachCampground.pictures[0].startsWith("http")
    //   ) {
    //     let pictures = [];
    //     for (let eachImage of eachReview.pictures) {
    //       const urlPicture = await getObjectSignedUrl(eachImage);
    //       pictures.push(urlPicture);
    //     }
    //     eachReview.pictures = pictures;
    //   }
    // }

    return res.status(200).json({ success: true, data: campReview });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// @desc Create a new review
// @route   POST /api/v1/userreviews/
// @access Private
exports.createReview = async (req, res, next) => {
  try {
    // if (req.file) {
    //   let pictures = [];
    //   for (let image of req.file) {
    //     const filename = generateFileName();
    //     uploadFile(image, filename, image.mimetype);
    //     pictures.push(filename);
    //   }
    //   req.body.pictures = pictures;
    // }

    const review = await Review.create(req.body);
    res.status(201).json({
      success: true,
      data: review,
    });

    const camp = await Camp.findById(review.campgroundId);

    const newReview = (camp.avgRating+review.rating)/camp.reviewCount;

    camp.avgRating = newReview;

    camp.save();


  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error creating review. Please try again",
    });
  }
};

exports.updateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: `Cannot find review`,
      });
    }

    if (req.user.id !== review.userId.toString() && req.user.role != "admin") {
      return res.status(403).json({
        message: "You are not authorized to edit this review.",
      });
    }

    if (req.body.rating !== undefined) review.rating = req.body.rating;
    if (req.body.comment !== undefined) review.comment = req.body.comment;
    if (req.body.pictures !== undefined) review.pictures = req.body.pictures;

    await review.save();
    res.status(200).json({
      success: true,
      message: "Review updated successfully.",
      review,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error updating review. Please try again",
    });
  }
};

// @desc    Delete a review by ID
// @route   DELETE /api/v1/userreviews/:id
// @access  Private
exports.deleteReview = async (req, res, next) => {
  try {


    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: `Cannot find review`,
      });
    }

    if (req.user.id !== review.userId.toString() && req.user.role != "admin") {
      return res.status(403).json({
        message: "You are not authorized to delete this review.",
      });
    }
    // let deletePictures;

    // // if (review.pictures && !review.pictures[0].startsWith("http")) {
    // //   deletePictures =  review.pictures;
    // // }

    await Review.deleteOne({ _id: req.params.id });

    // if(deletePictures && deletePictures.length != 0){
    //   for(let eachPicture of deletePictures){
    //     await deleteFile(eachPicture);
    //   }
    // }

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
// @route   GET /api/v1/reviews  (with query ?username=searchTerm&camp=searchTerm)
// @access  admin
exports.getUserReports = async (req, res, next) => {
  const searchUser = req.query.username;
  const searchCamp = req.query.campname;
  try {
    let query = { status: { reported: true } };

    if (searchUser && searchUser.trim() !== "") {
      query.username = { $regex: searchUser, $options: "i" };
    }

    if (searchCamp && searchCamp.trim() !== "") {
      query.campgroundName = { $regex: searchCamp, $options: "i" };
    }

    const campReview = await Review.find(query);

    // for (let eachReview of campReview) {
    //   if (
    //     eachReview.pictures &&
    //     !eachReview.pictures[0].startsWith("http")
    //   ) {
    //     let pictures = [];
    //     for (let eachImage of eachReview.pictures) {
    //       const urlPicture = await getObjectSignedUrl(eachImage);
    //       pictures.push(urlPicture);
    //     }
    //     eachReview.pictures = pictures;
    //   }
    // }

    return res.status(200).json({ success: true, data: campReview });
  } catch (err) {
    console.error("Error fetching reported reviews:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
