const express = require('express');

const { addAmenityBooking, getAmenityBookings,  getAmenityBooking, deleteAmenityBooking, updateAmenityBooking, getAmenityBookingByBookingId, deleteAmenityBookingByBookingId} = require('../controllers/amenityBookings');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require("../middleware/auth");

router.route('/').get(protect, getAmenityBookings).post(protect, authorize('admin','user','owner'), addAmenityBooking);
router.route('/:id').get(protect, getAmenityBooking).put(protect, authorize('admin','user','owner'), updateAmenityBooking).delete(protect, authorize('admin','user','owner'), deleteAmenityBooking);
router.route('/bookings/:bookingId').get(protect, getAmenityBookingByBookingId).delete(protect, authorize('admin','user','owner'), deleteAmenityBookingByBookingId);

module.exports = router;