const Amenity = require("../models/CampgroundAmenity");
const mongoose = require("mongoose"); // Import mongoose for error checking

exports.getAmenity = async (req, res, next) => {
  try {
    const amenity = await Amenity.find({ campgroundId: req.params.campId });
    res.status(200).json({ success: true, data: amenity });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: "Amenity not found",
    });
  }
};

exports.addAmenities = async (req, res, next) => {
  const amenity = await Amenity.create(req.body);
  res.status(201).json({
    success: true,
    data: amenity,
  });
};

exports.updateAmenity = async (req, res, next) => {
  try {
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

exports.deleteAmenity = async (req, res, next) => {
  try {
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
