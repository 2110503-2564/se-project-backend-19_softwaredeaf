const mongoose = require('mongoose');

const amenityTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  icon: { type: String }, // emoji / pic link. will design later. doesnt matter for backend
}, {
  timestamps: true
});

module.exports = mongoose.model('AmenityType', amenityTypeSchema);
