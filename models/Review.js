const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  camp: {
    type: mongoose.Schema.ObjectId,
    ref: "Camp",
    required: true,
  },
  picture: {
    type: String,
  },
  comment: {
    type: String,
  },
  rating: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("Review", ReviewSchema);
