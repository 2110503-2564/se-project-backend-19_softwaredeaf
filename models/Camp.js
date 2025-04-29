const mongoose = require('mongoose');

const CampSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters'],
  },
  address: {
    type: String,
    required: [true, 'Please add an address'],
    maxlength: [500, 'Address cannot be more than 500 characters'],
  },
  district: {
    type: String,
    required: [true, 'Please add a district'],
    maxlength: [100, 'District cannot be more than 100 characters'],
  },
  province: {
    type: String,
    required: [true, 'Please add a province'],
    maxlength: [100, 'Province cannot be more than 100 characters'],
  },
  postalcode: {
    type: String,
    required: [true, 'Please add a postal code'],
    maxlength: [5, 'Postal code cannot be more than 5 digits'],
  },
  region: {
    type: String,
    required: [true, 'Please add a region'],
    maxlength: [50, 'Region cannot be more than 50 characters'],
  },
  tel: {
    type: String,
    required: [true, 'Please add a phone number'],
    maxlength: [20, 'Phone number cannot be longer than 20 characters'],
  },
  picture: {
    type: String,
    default: "https://drive.google.com/uc?export=download&id=1oKpto0UrtlCWBrbyHJ4AriK7IKP_c9cz",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Campground must have an owner'],
  },
  avgRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    set: val => Math.round(val * 100) / 100,
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0,
  }
,
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Reverse populate with virtuals
CampSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'camp',
  justOne: false,
});

module.exports = mongoose.model('Camp', CampSchema);
