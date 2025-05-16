const mongoose = require('mongoose');

const DeletedAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  email: String,
  role: String, // "doctor" or "patient"
  reason: {
    type: String,
    required: true,
  },
  deletedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('DeletedAccount', DeletedAccountSchema);
