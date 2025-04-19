const express = require("express");
const {
  getAmenity,
  addAmenities,
  deleteAmenity,
  updateAmenity,
} = require("../controllers/amenity");

const router = express.Router({ mergeParams: true });

router.route("/").get(getAmenity).post(addAmenities);
router.route("/:id").delete(deleteAmenity).put(updateAmenity);

module.exports = router;
