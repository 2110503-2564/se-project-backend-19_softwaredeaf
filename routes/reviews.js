const express = require("express");
const {getUserReviews} = require("../controllers/review");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

router
  .route("/")
  .get(protect, authorize("admin"), getUserReviews);

module.exports = router;
