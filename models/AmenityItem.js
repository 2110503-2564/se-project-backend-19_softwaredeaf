const mongoose = require("mongoose");

const AmenityItemSchema = new mongoose.Schema({
  campgroundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Campground",
    required: true,
  },
  amenityTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AmenityType",
    required: true,
  },
  status: {
    type: String,
    enum: ["available", "booked"],
    default: "available",
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
});

const AmenityItem = mongoose.model("AmenityItem", AmenityItemSchema);
