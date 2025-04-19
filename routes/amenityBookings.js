const express = require('express');

const { addAmenityBooking, getAmenityBookings,  getAmenityBooking, deleteAmenityBooking, updateAmenityBooking} = require('../controllers/amenityBookings');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require("../middleware/auth");

// ใช้งาน handler ที่เป็น function จริง ๆ
router.route('/').get(protect, getAmenityBookings).post(protect, authorize('admin','owner'), addAmenityBooking);
router.route('/:id').get(protect, getAmenityBooking).put(protect, authorize('admin','owner'), updateAmenityBooking).delete(protect, authorize('admin','owner'), deleteAmenityBooking);

module.exports = router;
