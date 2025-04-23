const express = require("express");
const {
  getAmenity,
  addAmenities,
  deleteAmenity,
  updateAmenity,
} = require("../controllers/amenity");

const multer = require('multer');

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const router = express.Router({ mergeParams: true });
const { protect, authorize } = require("../middleware/auth");

router
  .route("/")
  .get(getAmenity)
  .post(protect, authorize("owner", "admin"), addAmenities);
  // upload.single('image')
router
  .route("/:id")
  .delete(protect, authorize("owner", "admin"), deleteAmenity)
  .put(protect, authorize("owner", "admin"), updateAmenity);

module.exports = router;
