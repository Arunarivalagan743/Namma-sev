const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => require('uuid').v4()
  },
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    maxLength: 100
  },
  phone: {
    type: String,
    required: true,
    maxLength: 15
  },
  address: {
    type: String,
    required: true
  },
  aadhaarLast4: {
    type: String,
    maxLength: 4
  },
  panchayatCode: {
    type: String,
    required: true,
    default: 'TIRU001',
    maxLength: 20
  },
  role: {
    type: String,
    enum: ['citizen', 'admin'],
    default: 'citizen'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes (only for fields without unique: true)
userSchema.index({ status: 1 });
userSchema.index({ panchayatCode: 1 });

module.exports = mongoose.model('User', userSchema);