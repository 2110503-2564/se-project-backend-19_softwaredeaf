const express = require('express');

const { addAmenityBooking, getAmenityBookings,  getAmenityBooking, deleteAmenityBooking, updateAmenityBooking} = require('../controllers/amenityBookings');

const router = express.Router({ mergeParams: true });

// ใช้งาน handler ที่เป็น function จริง ๆ
router.route('/').get(getAmenityBookings).post(addAmenityBooking);
router.route('/:id').get(getAmenityBooking).put(updateAmenityBooking).delete(deleteAmenityBooking);

module.exports = router;
