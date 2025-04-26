const express = require("express");
const {
  getMyReview,
  createReview,
  deleteReview,
  updateReview
} = require("../controllers/review");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

router
  .route("/")
  .post(protect, authorize("user", "owner", "admin"), createReview);
router
  .route("/:id")
  .get(protect, authorize("user", "owner", "admin"), getMyReview)
  .delete(protect, authorize("user", "owner", "admin"), deleteReview)
  .put(protect, authorize("user", "owner", "admin"), updateReview);


module.exports = router;
