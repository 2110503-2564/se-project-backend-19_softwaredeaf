const mongoose = require('mongoose');

const AmenityBookingSchema = new mongoose.Schema({
    campgroundBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    campgroundAmenityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CampgroundAmenity',
      required: true
    },
    amount: { type: Number, default: 1 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  }, {
    timestamps: true
  });

module.exports = mongoose.model('AmenityBooking', AmenityBookingSchema);