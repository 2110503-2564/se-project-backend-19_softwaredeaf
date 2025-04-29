const express = require('express');
const {getBookings, getBooking, addBooking, updateBooking, deleteBooking} = require('../controllers/bookings');

const router = express.Router({mergeParams:true});

const {protect, authorize} = require('../middleware/auth');

const amenityBookingRouter = require('./amenityBookings');

router.use('/:bookingId/amenities/:amenityId/amenitybookings',amenityBookingRouter);

router.route('/')
    .get(protect,authorize('admin','user','owner'), getBookings)//add authorize by kwan
    .post(protect, authorize('admin','user','owner'), addBooking);
router.route('/:id')
    .get(protect, authorize('admin','user','owner'),getBooking)//add authorize by kwan
    .put(protect, authorize('admin','user','owner'), updateBooking)
    .delete(protect, authorize('admin','user','owner'), deleteBooking);

module.exports = router;