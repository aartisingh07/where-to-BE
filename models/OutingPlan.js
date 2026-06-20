const mongoose = require('mongoose');

const outingPlanSchema = new mongoose.Schema({
  roomName: {
    type: String,
    required: true,
  },
  placeName: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    default: '',
  },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  mapsLink: { type: String, default: '' },
  dateTime: {
    type: Date,
    required: true,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
  ],
  reminderSent: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('OutingPlan', outingPlanSchema);
