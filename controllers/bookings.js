const Booking = require("../models/Booking");
const Camp = require("../models/Camp");
const { getObjectSignedUrl } = require('./s3.js');

//@desc     Get all bookings
//@route    GET /api/v1/bookings
//@access   Public
exports.getBookings = async (req, res, next) => {
  let query;
  //General users can see only their bookings!
  if (req.user.role !== "admin") {
    if(req.user.role == "owner"){
      if (req.query.campId) {
        query = Booking.find({ camp: req.query.campId }).populate({
          path: "camp",
          select: "name province tel picture",
        });
      }else{
        const ownedCamps = await Camp.find({ owner: req.user.id }).select("_id");
        const campIds = ownedCamps.map(camp => camp._id);

        query = Booking.find({ camp: { $in: campIds } })
          .populate({
            path: "camp",
            select: "name province tel picture",
          });
      }
    }else{
      query = Booking.find({ user: req.user.id }).populate({
        path: "camp",
        select: "name province tel picture",
      });
    }
  } else {
    //If you are an admin, you can see all!
    if (req.params.campId) {
      console.log(req.params.campId);
      query = Booking.find({ camp: req.params.campId }).populate({
        path: "camp",
        select: "name province tel picture",
      });
    } else {
      query = Booking.find().populate({
        path: "camp",
        select: "name tel picture",
      });
    }
  }
  try {
    const bookings = await query;

    for(let eachBooking of bookings){
      if(eachBooking.camp.picture && !eachBooking.camp.picture.startsWith("http")){
        eachBooking.camp.picture = await getObjectSignedUrl(eachBooking.camp.picture);
      }
    }

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (err) {
    console.log(err.stack);
    return res.status(500).json({
      success: false,
      message: "Booking not found",
    });
  }
};

//@desc     Get single booking
//@route    GET /api/v1/bookings/:id
//@access   Public
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: "camp",
      select: "name description tel",
    });

    if (!booking) {
      return res
        .status(404)
        .json({
          success: false,
          message: `No Booking with the id of ${req.params.id}`,
        });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    console.log(err.stack);
    return res.status(500).json({
      success: false,
      message: "Booking not found",
    });
  }
};

//@desc     Add booking
//@route    POST /api/v1/camps/:campId/booking
//@access   Private
exports.addBooking = async (req, res, next) => {
  try {
    req.body.camp = req.params.campId;

    const camp = await Camp.findById(req.params.campId);

    if (!camp) {
      return res.status(404).json({
        success: false,
        message: `No camp with the id of ${req.params.campId}`,
      });
    }

    //add user Id to req.body
    req.body.user = req.user.id;

    //Check for existed Booking
    const existedBookings = await Booking.find({ user: req.user.id ,visited: false });

    //If the user is not an admin, they can only create 3 bookings.
    if (existedBookings.length >= 3 && req.user.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: `The user with ID ${req.user.id} has already made 3 bookings`,
      });
    }

    const booking = await Booking.create(req.body);

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    console.log(err.stack);
    return res.status(500).json({
      success: false,
      message: "Cannot create a Booking",
    });
  }
};

//@desc     Update booking
//@route    PUT /api/v1/bookings/:id
//@access   Private
exports.updateBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`,
      });
    }

    //Make sure user is the booking owner
    const campground = await Camp.findById(booking.camp);

    if (!campground) {
      return res.status(404).json({
        success: false,
        message: `No campground with the id of ${booking.camp}`,
      });
    }

    if (req.user.role === "user" && booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this bootcamp`,
      });
    } else if (
      req.user.role === "owner" &&
      campground.owner.toString() !== req.user.id &&
      booking.user.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this bootcamp`,
      });
    }

    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    console.log(err.stack);
    return res.status(500).json({
      success: false,
      message: "Cannot update Booking",
    });
  }
};

//@desc     Delete booking
//@route    DELETE /api/v1/bookings/:id
//@access   Private
exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`,
      });
    }

    //Make sure user is the booking owner
    const campground = await Camp.findById(booking.camp);

    if (!campground) {
      return res.status(404).json({
        success: false,
        message: `No campground with the id of ${booking.camp}`,
      });
    }

    if (req.user.role === "user" && booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this bootcamp`,
      });
    } else if (
      req.user.role === "owner" &&
      campground.owner.toString() !== req.user.id &&
      booking.user.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this bootcamp`,
      });
    }

    await booking.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    console.log(err.stack);
    return res.status(500).json({
      success: false,
      message: "Cannot delete Booking",
    });
  }
};
