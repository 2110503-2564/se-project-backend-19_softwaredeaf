const AmenityBooking = require("../models/AmenityBooking");
const Camp = require("../models/Camp");
const CampgroundAmenity = require("../models/CampgroundAmenity");
const Booking = require("../models/Booking");
const { updateAmenity } = require("./amenity");
const mongoose = require("mongoose");

/**
 * Get total booked amount for an amenity within a date range (overlapping)
 */
const getAmenityBookedAmount = async (campgroundAmenityId, startDate, endDate) => {
  const query = { campgroundAmenityId };

  if (startDate || endDate) {
    query.$or = [
      {
        startDate: { $lte: endDate || new Date("9999-12-31") },
        endDate: { $gte: startDate || new Date("0000-01-01") },
      },
    ];
  }

  const result = await AmenityBooking.aggregate([
    { $match: query },
    {
      $group: {
        _id: "$campgroundAmenityId",
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

  return result[0]?.totalAmount || 0;
};

/**
 * Get available quantity of an amenity in a date range
 */
const getAvailableAmenityQuantity = async (amenityId, startDate, endDate) => {
  const amenity = await CampgroundAmenity.findById(amenityId);
  if (!amenity) throw new Error("Amenity not found");

  const bookedAmount = await getAmenityBookedAmount(amenityId, startDate, endDate);
  const available = Math.max(0, amenity.quantity - bookedAmount);

  return {
    amenityId,
    name: amenity.name,
    totalQuantity: amenity.quantity,
    totalBooked: bookedAmount,
    available,
  };
};

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

// @desc    Get amenity booking by bookingId
// @route   GET /api/v1/amenitybookings/bookings/:bookingId
// @access  Public

exports.getAmenityBookingByBookingId = async (req, res, next) => {

  const { bookingId } = req.params;

  try {
    const amenityBookings = await AmenityBooking.find({
      campgroundBookingId: bookingId,
    })
      .populate("campgroundBookingId")
      .populate("userId")
      .populate("campgroundAmenityId");

    if (!amenityBookings) {
      return res
        .status(404)
        .json({ success: false, message: "Amenity bookings not found" });
    }

    res.status(200).json({
      success: true,
      data: amenityBookings,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Add new amenity booking (with overbooking prevention)
// @route   POST /api/v1/bookings/:bookingId/amenities/:amenityId/amenitybookings
// @access  Private
exports.addAmenityBooking = async (req, res, next) => {
  try {
    const campgroundAmenityId = req.params.amenityId;
    const bookingId = req.params.bookingId;
    const { amount, startDate, endDate } = req.body;

    // 🛑 Validate date range
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Start date must be on or before end date",
      });
    }

    // 1. Check if booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // 2. Check if amenity belongs to this campground
    const amenity = await CampgroundAmenity.findOne({
      _id: campgroundAmenityId,
      campgroundId: booking.camp.toString(),
    });
    if (!amenity) {
      return res.status(400).json({
        success: false,
        message: "Amenity does not belong to this camp",
      });
    }

    // 3. Check availability (overbooking prevention)
    const availability = await getAvailableAmenityQuantity(
      campgroundAmenityId,
      new Date(startDate),
      new Date(endDate)
    );

    if (amount > availability.available) {
      return res.status(400).json({
        success: false,
        message: `Not enough availability. Requested: ${amount}, Available: ${availability.available}`,
      });
    }

    // 4. Create booking
    const amenityBooking = await AmenityBooking.create({
      userId: req.user.id,
      campgroundBookingId: bookingId,
      campgroundAmenityId,
      amount,
      startDate,
      endDate,
    });

    amenity.amountbooked += amenityBooking.amount;
    await amenity.save();

    res.status(201).json({
      success: true,
      data: { _id: amenityBooking._id },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// @desc    Update amenity booking (with overbooking prevention)
// @route   PUT /api/v1/amenitybookings/:id
// @access  Private
exports.updateAmenityBooking = async (req, res, next) => {
  try {
    const { amount, startDate, endDate, campgroundAmenityId } = req.body;

    // 🛑 1. Validate date range
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Start date must be on or before end date",
      });
    }

    // 🧾 2. Find existing booking to preserve context
    const existing = await AmenityBooking.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`,
      });
    }

    const newAmenityId = campgroundAmenityId || existing.campgroundAmenityId;
    const newStart = new Date(startDate || existing.startDate);
    const newEnd = new Date(endDate || existing.endDate);
    const newAmount = amount || existing.amount;

    // 🧠 3. Recalculate availability **excluding current booking**
    const allBookings = await AmenityBooking.aggregate([
      {
        $match: {
          campgroundAmenityId: new mongoose.Types.ObjectId(newAmenityId),
          _id: { $ne: existing._id }, // Exclude current booking
          $or: [
            { startDate: { $lte: newEnd }, endDate: { $gte: newStart } },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalBooked: { $sum: "$amount" },
        },
      },
    ]);

    const totalOtherBooked = allBookings[0]?.totalBooked || 0;
    const amenity = await CampgroundAmenity.findById(newAmenityId);
    if (!amenity) {
      return res.status(404).json({ success: false, message: "Amenity not found" });
    }

    const available = Math.max(0, amenity.quantity - totalOtherBooked);

    if (newAmount > available) {
      return res.status(400).json({
        success: false,
        message: `Not enough availability. Requested: ${newAmount}, Available: ${available}`,
      });
    }

    const amenitybooking = await AmenityBooking.findById(req.params.id)
    .populate("campgroundBookingId")
    .populate("campgroundAmenityId");

    if (!amenitybooking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`,
      });
    }

    //Make sure user is the booking owner
    const campground = await Camp.findById(amenitybooking.campgroundAmenityId.campgroundId);
    console.log(amenitybooking.campgroundAmenityId);
    if(!campground) {
        return res.status(404).json({
            success: false,
            message: `No campground with the id of ${amenitybooking.campgroundAmenityId.campgroundId}`
        });
    }

    if(req.user.role === 'user' && amenitybooking.userId.toString() !== req.user.id)
    {
        return res.status(403).json({
            success: false,
            message: `User ${req.user.id} is not authorized to delete this bootcamp`
         });
    }else if(req.user.role === 'owner' && campground.owner.toString() !== req.user.id && amenitybooking.userId.toString() !== req.user.id){
        return res.status(403).json({
            success: false,
            message: `User ${req.user.id} is not authorized to delete this bootcamp`
        });
    }

    amenity.amountbooked += req.body.amount - amenitybooking.amount;

    // 🛠️ 4. Proceed with update
    const updated = await AmenityBooking.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    await amenity.save();

    res.status(200).json({
      success: true,
      data: updated,
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
    const amenitybooking = await AmenityBooking.findById(req.params.id)
    .populate("campgroundBookingId")
    .populate("campgroundAmenityId");

    if (!amenitybooking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`,
      });
    }

    //Make sure user is the booking owner
    const campground = await Camp.findById(amenitybooking.campgroundAmenityId.campgroundId);

    if(!campground) {
        return res.status(404).json({
            success: false,
            message: `No campground with the id of ${amenitybooking.campgroundAmenityId.campgroundId}`
        });
    }

    if(req.user.role === 'user' && amenitybooking.userId.toString() !== req.user.id)
    {
        return res.status(403).json({
            success: false,
            message: `User ${req.user.id} is not authorized to delete this bootcamp`
         });
    }else if(req.user.role === 'owner' && campground.owner.toString() !== req.user.id && amenitybooking.userId.toString() !== req.user.id){
        return res.status(403).json({
            success: false,
            message: `User ${req.user.id} is not authorized to delete this bootcamp`
        });
    }
    const amenity = await CampgroundAmenity.findById(amenitybooking.campgroundAmenityId._id);

    amenity.amountbooked -= amenitybooking.amount;

    await amenitybooking.deleteOne();

    await amenity.save();

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

// @desc    Delete amenity bookings by bookingId
// @route   DELETE /api/v1/amenitybookings/bookings/:bookingId
// @access  Private
exports.deleteAmenityBookingByBookingId = async (req, res, next) => {
  try {
    const amenitybooking = await AmenityBooking.find({
      campgroundBookingId: req.params.bookingId,
    }).populate("campgroundAmenityId").populate("campgroundBookingId");

    if (!amenitybooking || amenitybooking.length === 0 || !amenitybooking[0].campgroundAmenityId) {
      return res.status(200).json({
        success: true,
        message: `No amenity bookings`,
      });
    }
    //Make sure user is the booking owner
    const campground = await Camp.findById(amenitybooking[0].campgroundAmenityId.campgroundId);
    if(!campground) {
        return res.status(404).json({
            success: false,
            message: `No campground with the id of ${amenitybooking[0].campgroundAmenityId.campgroundId}`
        });
    }

    if(req.user.role === 'user' && amenitybooking[0].userId.toString() !== req.user.id)
    {
        return res.status(403).json({
            success: false,
            message: `User ${req.user.id} is not authorized to delete this bootcamp`
         });
    }else if(req.user.role === 'owner' && campground.owner.toString() !== req.user.id && amenitybooking[0].userId.toString() !== req.user.id){
        return res.status(403).json({
            success: false,
            message: `User ${req.user.id} is not authorized to delete this bootcamp`
        });
    }

    for (const eachBooking of amenitybooking) {
      if (!eachBooking.campgroundAmenityId) continue;

      const amenity = await CampgroundAmenity.findById(eachBooking.campgroundAmenityId._id);
      amenity.amountbooked -= eachBooking.amount;
      await amenity.save();
    }

    await AmenityBooking.deleteMany({
      campgroundBookingId: req.params.bookingId,
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${amenitybooking.length} amenity booking(s).`,
    });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      message: "Cannot delete AmenityBooking(s)",
    });
  }
};
