const express = require('express');
const { getMyReview } =require('../controllers/review')

const router = express.Router();


router.route('/:id').get(getMyReview);

module.exports = router;
