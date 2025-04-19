const express = require('express');
const {getBookings, getBooking, addBooking, updateBooking, deleteBooking} = require('../controllers/bookings');

const router = express.Router({mergeParams:true});

const {protect, authorize} = require('../middleware/auth');

router.route('/')
    .get(protect, getBookings)
    .post(protect, authorize('admin','user','owner'), addBooking);
router.route('/:id')
    .get(protect, getBooking)
    .put(protect, authorize('admin','user','owner'), updateBooking)
    .delete(protect, authorize('admin','user','owner'), deleteBooking);

module.exports = router;
