const express = require("express");
const { getAmenity, addAmenities } = require("../controllers/amenity");

const router = express.Router({ mergeParams: true });

router.route("/").get(getAmenity).post(addAmenities);

module.exports = router;
