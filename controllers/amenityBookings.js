const AmenityBooking = require('../models/AmenityBooking');
const Camp = require('../models/Camp');
const CampgroundAmenity = require('../models/CampgroundAmenity');
const Booking = require('../models/Booking')

// @desc    Get all amenity bookings
// @route   GET /api/v1/amenitybookings
// @access  Public

exports.getAmenityBookings = async (req, res, next) => {
  try {
    const amenityBookings = await AmenityBooking.find(); // ดึงข้อมูลทั้งหมด

    res.status(200).json({
      success: true,
      count: amenityBookings.length,
      data: amenityBookings
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


// @desc    Get single amenity booking
// @route   GET /api/v1/amenitybookings/:id
// @access  Public
exports.getAmenityBooking = async (req, res, next) => {
  try {
    const amenityBooking = await AmenityBooking.findById(req.params.id)
      .populate('campgroundBookingId')
      .populate('userId')
      .populate('campgroundAmenityId');

    if (!amenityBooking) {
      return res.status(404).json({ success: false, message: 'Amenity booking not found' });
    }

    res.status(200).json({
      success: true,
      data: amenityBooking
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Add new amenity booking
// @route   POST /api/v1/camps/:campId/amenities/:amenityId/amenitybookings
// @access  Private
exports.addAmenityBooking = async (req, res, next) => {
    try {
      const { campgroundAmenityId, amount, startDate, endDate } = req.body;
      const campId = req.params.campId;
  
      // 1. Check if camp exists
      const camp = await Camp.findById(campId);
      console.log("dswdcedcwerfwerfcwercampId");
        console.log(campId);

      if (!camp) {
        return res.status(404).json({ success: false, message: 'Camp not found' });
      }
  
      // 2. Check if the campgroundAmenityId belongs to the camp
      const amenity = await CampgroundAmenity.findOne({
        _id: campgroundAmenityId,
        campId: campId // 👈 ชื่อ field ที่ใช้อ้างอิงแคมป์ใน CampgroundAmenity
      });
  
      if (!amenity) {
        return res.status(400).json({ success: false, message: 'Amenity does not belong to this camp' });
      }
  
      // 3. Create Amenity Booking
      const amenityBooking = await AmenityBooking.create({
        campgroundAmenityId,
        campgroundBookingId: req.body.campgroundBookingId, // ควรตรวจสอบว่า bookingId ถูกต้องด้วย ถ้ามี logic เพิ่ม
        userId: req.user.id,
        amount,
        startDate,
        endDate
      });
  
      res.status(201).json({
        success: true,
        data: { _id: amenityBooking._id }
      });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  };