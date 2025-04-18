const mongoose = require("mongoose");

const AmenityTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

const AmenityType = mongoose.model("AmenityType", AmenityTypeSchema);
