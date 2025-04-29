const express = require("express");
const {
  createReview,
  deleteReview,
  updateReview
} = require("../controllers/review");

const multer = require('multer')

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const { protect, authorize } = require("../middleware/auth");
const router = express.Router({ mergeParams: true });

router
  .route("/")
  .post(protect, authorize("user", "owner", "admin"),upload.array('images',3), createReview);
router
  .route("/:id")
  .delete(protect, authorize("user", "admin"), deleteReview)
  .put(protect, authorize("user", "owner", "admin"),upload.array('images',3), updateReview);

module.exports = router;