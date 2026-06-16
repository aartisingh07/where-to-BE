const mongoose = require('mongoose');

const savedPlaceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: 'Place',
  },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  osmId: { type: String },
  address: { type: String, default: '' },
  savedAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent duplicate saves of same place by same user
savedPlaceSchema.index({ user: 1, osmId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('SavedPlace', savedPlaceSchema);
