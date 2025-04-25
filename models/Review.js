const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
    unique: true,
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
    maxlength: [1000, 'Comment length exceeded 1000 letters']
  },
  rating: {
    type: Number,
    required: true,
    min: [0.5, 'Too little stars.'],
    max: [5.0, 'Too much stars.'],
  },
  status: {
    type: String,
    enum: ['normal', 'reported'],
    default: 'normal'
  }
}, { timestamps: true });

module.exports = mongoose.model("Review", ReviewSchema);
