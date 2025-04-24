const express = require('express');
const { getMyReview,createReview } =require('../controllers/review')

const router = express.Router();


const {protect,authorize} = require('../middleware/auth');

router.route('/').post(protect,authorize('user','owner','admin'),createReview);
router.route('/:id').get(protect,authorize('user','owner','admin'),getMyReview)


module.exports = router;
