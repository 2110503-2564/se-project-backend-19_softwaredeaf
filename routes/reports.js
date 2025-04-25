const express = require("express");
const {getUserReports} = require("../controllers/review");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

router
  .route("/")
  .get(protect, authorize("admin"), getUserReports);

module.exports = router;
