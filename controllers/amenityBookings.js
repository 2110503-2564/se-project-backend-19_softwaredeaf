const AmenityBooking = require("../models/AmenityBooking");
const Camp = require("../models/Camp");
const CampgroundAmenity = require("../models/CampgroundAmenity");
const Booking = require("../models/Booking");
const { updateAmenity } = require("./amenity");
const mongoose = require("mongoose"); 

// @desc    Get all amenity bookings
// @route   GET /api/v1/amenitybookings
// @access  Public

exports.getAmenityBookings = async (req, res, next) => {
  try {
    const amenityBookings = await AmenityBooking.find(); // ดึงข้อมูลทั้งหมด

    res.status(200).json({
      success: true,
      count: amenityBookings.length,
      data: amenityBookings,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get single amenity booking
// @route   GET /api/v1/amenitybookings/:id
// @access  Public
exports.getAmenityBooking = async (req, res, next) => {
  try {
    const amenityBooking = await AmenityBooking.findById(req.params.id)
      .populate("campgroundBookingId")
      .populate("userId")
      .populate("campgroundAmenityId");

    if (!amenityBooking) {
      return res
        .status(404)
        .json({ success: false, message: "Amenity booking not found" });
    }

    res.status(200).json({
      success: true,
      data: amenityBooking,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Add new amenity booking
// @route   POST /api/v1/bookings/:bookingId/amenities/:amenityId/amenitybookings
// @access  Private
exports.addAmenityBooking = async (req, res, next) => {
  try {
    const campgroundAmenityId = req.params.amenityId;
    const bookingId = req.params.bookingId;

    // 1. Check if camp exists
    const booking = await Booking.findById(bookingId);
    //console.log("dswdcedcwerfwerfcwercampId");
    //console.log(campId);

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // 2. Check if the campgroundAmenityId belongs to the camp
    const amenity = await CampgroundAmenity.findOne({
      _id: campgroundAmenityId,
      campgroundId: booking.camp.id, // 👈 ชื่อ field ที่ใช้อ้างอิงแคมป์ใน CampgroundAmenity
    });

    if (!amenity) {
      return res.status(400).json({
        success: false,
        message: "Amenity does not belong to this camp",
      });
    }

    // 3. Create Amenity Booking
    const amenityBooking = await AmenityBooking.create({
      userId: req.user.id,
      campgroundBookingId: bookingId, // จาก URL /:bookingId/amenitybooking
      campgroundAmenityId: campgroundAmenityId,
      amount: req.body.amount,
      startDate: req.body.startDate,
      endDate: req.body.endDate
    });

    res.status(201).json({
      success: true,
      data: { _id: amenityBooking._id },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

//@desc     Update amenity booking
//@route    PUT /api/v1/amenitybookings/:id
//@access   Private
exports.updateAmenityBooking = async (req, res, next) => {
  try {
    const amenitybooking = await AmenityBooking.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body, // Spread the entire body into the update
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!amenitybooking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: amenitybooking,
    });
  } catch (err) {
    console.error(err.stack);
    return res.status(500).json({
      success: false,
      message: "Cannot update AmenityBooking",
    });
  }
};

//@desc     Delete amenity booking
//@route    DELETE /api/v1/amenitybookings/:id
//@access   Private
exports.deleteAmenityBooking = async (req, res, next) => {
  try {
    const amenitybooking = await AmenityBooking.findById(req.params.id);

    if (!amenitybooking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`,
      });
    }

    await amenitybooking.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    console.log(err.stack);
    return res.status(500).json({
      success: false,
      message: "Cannot delete AmenityBooking",
    });
  }
};
