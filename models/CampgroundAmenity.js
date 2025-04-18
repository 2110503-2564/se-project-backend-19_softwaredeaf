const mongoose = require('mongoose');

const campgroundAmenitySchema = new mongoose.Schema({
  campgroundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campground', required: true },
  amenityTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'AmenityType', required: true },
  status: {
    type: String,
    enum: ['available', 'maintenance', 'unavailable'],
    default: 'available'
  },
  price: { type: Number, default: 0 }, // optional
  quantity: { type: Number, default: 1 } // optional
}, {
  timestamps: true
});

module.exports = mongoose.model('CampgroundAmenity', campgroundAmenitySchema);
