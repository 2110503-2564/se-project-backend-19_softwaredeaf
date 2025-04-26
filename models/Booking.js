const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    camp:{
        type: mongoose.Schema.ObjectId,
        ref: 'Camp',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    bookstatus:{
        type: String,
        default: "booked",
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Booking', BookingSchema);
