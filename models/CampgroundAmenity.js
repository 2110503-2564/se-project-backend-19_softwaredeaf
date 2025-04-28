const mongoose = require('mongoose');

const campgroundAmenitySchema = new mongoose.Schema({
  campgroundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Camp',
    required: true
  },

  name: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  quantity: { type: Number, default: 1 },
  price: { type: Number, default: 0 },
  amountbooked:{ type: Number, default: 0 },
  status: {
    type: String,
    enum: ['available', 'maintenance', 'unavailable'],
    default: 'available'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CampgroundAmenity', campgroundAmenitySchema);
