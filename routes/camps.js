const express = require('express');
const multer = require('multer');
const {getCamps, getCamp, createCamp, updateCamp, deleteCamp} = require('../controllers/camps');

//include other resource routers
const bookingRouter = require('./bookings');

const router = express.Router();

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const {protect,authorize} = require('../middleware/auth');
const { optionalAuth } = require('../middleware/optionalAuth');

//re-route into other resource router
router.use('/:campId/bookings/',bookingRouter);

router.route('/').get(optionalAuth,getCamps).post(protect, authorize('admin', 'owner'),upload.single('image'), createCamp);
router.route('/:id').get(getCamp).put(protect, authorize('admin', 'owner'),upload.single('image'), updateCamp).delete(protect, authorize('admin', 'owner'), deleteCamp);

module.exports = router;
