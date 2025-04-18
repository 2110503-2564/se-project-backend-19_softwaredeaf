const Amenity = require("../models/AmenityItem");

exports.getAmenity = async (req, res, next) => {
  const amenity = await Amenity.findO; // filter by campgroundI
  if (!amenity) {
    return res.status(404).json({
      success: false,
      message: "Amenity not found for this campground",
    });
  }
  res.status(200).json({ success: true, data: amenity });
};

exports.addAmenitie = async (req, res, next) => {
  let Amenity = await Amenity.findById(req.params.id);
  if (!Amenity) {
    return res.status(400).json({ success: false });
  }
};
