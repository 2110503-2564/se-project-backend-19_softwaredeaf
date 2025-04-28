const express = require("express");
const {getUserReports,reportReview} = require("../controllers/review");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

router
  .route("/")
  .get(protect, authorize("admin"), getUserReports);

router
  .route("/:id")
  .put(protect,authorize("admin","owner"),reportReview);


module.exports = router;
