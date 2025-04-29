const express = require('express');
const { getCampReview } =require('../controllers/review')

const router = express.Router();

router.route('/:id').get(getCampReview);

module.exports = router;
