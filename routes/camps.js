const express = require('express');
const {getCamps, getCamp, createCamp, updateCamp, deleteCamp} = require('../controllers/camps');

//include other resource routers
const bookingRouter = require('./bookings');
const amenityBookingRouter = require('./amenityBookings');

const router = express.Router();

const {protect,authorize} = require('../middleware/auth');

//re-route into other resource router
router.use('/:campid/bookings/',bookingRouter);
router.use('/:campId/amenities/:amenityId/amenitybookings',amenityBookingRouter);


router.route('/').get(getCamps).post(protect, authorize('admin', 'owner'), createCamp);
router.route('/:id').get(getCamp).put(protect, authorize('admin', 'owner'), updateCamp).delete(protect, authorize('admin', 'owner'), deleteCamp);

module.exports = router;
