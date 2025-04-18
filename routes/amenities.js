const express = require("express");
const { getAmenity } = require("../controllers/amenity");

const router = express.Router({ mergeParams: true });

router.route("/").get(getAmenity);

module.exports = router;
