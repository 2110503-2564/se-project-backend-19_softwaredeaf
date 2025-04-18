const Amenity = require("../models/CampgroundAmenity");
const mongoose = require("mongoose"); // Import mongoose for error checking
const Camp = require("../models/Camp");

// @desc    Get all campground amenity
// @route   GET /api/v1/camps/:campId/amenities
// @access  Public

exports.getAmenity = async (req, res, next) => {
  try {
    const campId = req.params.campId;

    const amenity = await Amenity.find({ campgroundId: campId })
      .populate('campgroundId');

    res.status(200).json({ success: true, data: amenity });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: "Amenity not found",
    });
  }
};


// @desc    Create new campground amenity
// @route   POST /api/v1/camps/:campId/amenities
// @access  Private
exports.addAmenities = async (req, res, next) => {
  try {
    const campId = req.params.campId;
    const camp = await Camp.findById(campId);
    const owner = camp.owner;
    if (owner.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to add this amenity`,
      });
    }
    const amenity = await Amenity.create(req.body);
    res.status(201).json({
      success: true,
      data: amenity,
    });
  } catch (err) {
    return res.status(400).json({ success: false });
  }
};

// @desc    Update amenities
// @route   PUT /api/v1/camps/:campId/amenities
// @access  Private

exports.updateAmenity = async (req, res, next) => {
  try {
    const campId = req.params.campId;
    const camp = await Camp.findById(campId);
    const owner = camp.owner;
    if (owner.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to add this amenity`,
      });
    }

    const amenity = await Amenity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!amenity) {
      return res.status(400).json({
        success: false,
        message: `Amenity not found`,
      });
    }
    res.status(200).json({
      success: true,
      data: amenity,
    });
  } catch (err) {
    return res.status(400).json({ success: false });
  }
};

// @desc    Delete amenities
// @route   DELETE /api/v1/camps/:campId/amenities
// @access  Private

exports.deleteAmenity = async (req, res, next) => {
  try {
    const campId = req.params.campId;
    const camp = await Camp.findById(campId);
    const owner = camp.owner;
    if (owner.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to add this amenity`,
      });
    }
    const amenity = await Amenity.findById(req.params.id);
    if (!amenity) {
      return res.status(400).json({
        success: false,
        message: `Amenity not found`,
      });
    }
    await Amenity.deleteOne({ _id: req.params.id });
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    return res.status(400).json({ success: false });
  }
};
