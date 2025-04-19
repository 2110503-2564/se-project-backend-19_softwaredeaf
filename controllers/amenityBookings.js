const AmenityBooking = require('../models/AmenityBooking');
const Camp = require('../models/Camp');
const CampgroundAmenity = require('../models/CampgroundAmenity');
const Booking = require('../models/Booking');
const { updateAmenity } = require('./amenity');

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
      const campgroundAmenityId = req.params.amenityId;
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
        campgroundId: campId // 👈 ชื่อ field ที่ใช้อ้างอิงแคมป์ใน CampgroundAmenity
      });
  
      if (!amenity) {
        return res.status(400).json({ success: false, message: 'Amenity does not belong to this camp' });
      }
  
      // 3. Create Amenity Booking
      const amenityBooking = await AmenityBooking.create({
        userId: "6615dbec06687492895ebfd0", // หรือ req.user._id ถ้าใช้ _id
        campgroundBookingId: "6615dbec06687492895ebfd0", // จาก URL /:bookingId/amenitybooking
        campgroundAmenityId: "68031cf782e7300ae6e6bbe7",
        amount: 2,
        startDate: "2025-04-25T12:00:00.000Z",
        endDate: "2025-04-26T12:00:00.000Z"
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
  
  //@desc     Update amenity booking
  //@route    PUT /api/v1/amenitybookings/:id
  //@access   Private
  exports.updateAmenityBooking = async (req, res, next) => {
    try {
            let amenitybooking = await AmenityBooking.findById(req.params.id);
    
            if(!amenitybooking) {
                return res.status(404).json({
                    success: false,
                    message: `No booking with the id of ${req.params.id}`
                });
            }
    
            //Make sure user is the booking owner
            /*
            if(amenitybooking.user.toString() !== req.user.id && req.user.role !== 'admin') {
                return res.status(401).json({
                    success: false,
                    message: `User ${req.user.id} is not authorized to update this booking`
                });
            }
            */
    
            amenitybooking = await AmenityBooking.findByIdAndUpdate(req.params.id,{
                userId: "666666666666666666666666", // หรือ req.user._id ถ้าใช้ _id
                campgroundBookingId: "6615dbec06687492895ebfd0", // จาก URL /:bookingId/amenitybooking
                campgroundAmenityId: "68031cf782e7300ae6e6bbe7",
                amount: 1,
                startDate: "2025-06-25T12:00:00.000Z",
                endDate: "2025-06-26T12:00:00.000Z"
            },{
                new: true,
                runValidators: true
            });
    
            res.status(200).json({
                success: true,
                data: amenitybooking
            });
        } catch(err) {
            console.log(err.stack);
            return res.status(500).json({
                success: false,
                message: "Cannot update AmenityBooking"
            });
        }
  };

  //@desc     Delete amenity booking
  //@route    DELETE /api/v1/amenitybookings/:id
  //@access   Private
  exports.deleteAmenityBooking = async (req, res, next) => {
    try {
            const amenitybooking = await AmenityBooking.findById(req.params.id);
    
            if(!amenitybooking) {
                return res.status(404).json({
                    success: false,
                    message: `No booking with the id of ${req.params.id}`
                });
            }
    
            await amenitybooking.deleteOne();
    
            res.status(200).json({
                success: true,
                data: {}
            });
        } catch(err) {
            console.log(err.stack);
            return res.status(500).json({
                success: false,
                message: "Cannot delete AmenityBooking"
            });
        }
  };