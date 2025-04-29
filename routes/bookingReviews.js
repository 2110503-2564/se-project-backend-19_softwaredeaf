const express = require("express");
const {
  getReview
} = require("../controllers/review");

const multer = require('multer')

const { protect, authorize } = require("../middleware/auth");
const router = express.Router({ mergeParams: true });

router
  .route("/:id")
  .get(protect, authorize("user", "owner", "admin"), getReview)

module.exports = router;