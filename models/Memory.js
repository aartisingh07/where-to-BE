const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  caption: {
    type: String,
    default: ''
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'connections'],
    default: 'public'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Memory', memorySchema);
