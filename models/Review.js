const mongoose = require('mongoose');

const campgroundReviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  username: {
    type: String,
    required: true, // Filled from user document on creation
  },
  campgroundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Camp',
    required: true,
  },
  campgroundName: {
    type: String,
    required: true, // Stored for faster queries/display
  },
  rating: {
    type: Number,
    required: true,
    min: 0.5,
    max: 5,
    validate: {
      validator: function (val) {
      return Number.isFinite(val) && val * 2 === Math.floor(val * 2);
    },
      message: 'Rating must be in 0.5 steps (e.g. 1.0, 1.5, 2.0) from 0.5 to 5',
    },
  },
  comment: {
    type: String,
    required: true,
    maxlenght: 1000
  },
  pictures: {
    type: [String], // S3 URLs
    validate: {
      validator: arr => arr.length <= 3,
      message: 'You can upload a maximum of 3 pictures.',
    },
  },
  status: {
    reported: {
      type: Boolean,
      default: false,
    },
  },
  report: {
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'fake', 'other'],
    },
    otherReasonText: {
      type: String,
      maxlenght: 200,
      required: function () {
        return this.report?.reason === 'other';
      },
    },
  },
}, {
  timestamps: true,
});

campgroundReviewSchema.index({ campgroundId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('CampgroundReview', campgroundReviewSchema);