const mongoose = require('mongoose');

// Complaint Schema
const complaintSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => require('uuid').v4()
  },
  trackingId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    required: true,
    maxLength: 200
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Road & Infrastructure',
      'Water Supply',
      'Electricity',
      'Sanitation',
      'Street Lights',
      'Drainage',
      'Public Health',
      'Encroachment',
      'Noise Pollution',
      'Other'
    ]
  },
  location: {
    type: String,
    maxLength: 255
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'rejected'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  adminRemarks: {
    type: String
  },
  imageUrl: {
    type: String
  },
  imageUrl2: {
    type: String
  },
  imageUrl3: {
    type: String
  },
  contactPhone: {
    type: String,
    maxLength: 15
  },
  wardNumber: {
    type: String,
    maxLength: 10
  },
  isPublic: {
    type: Boolean,
    default: false,
    index: true
  },
  estimatedResolutionDays: {
    type: Number,
    default: 10
  },
  resolvedAt: {
    type: Date
  },
  assignedTo: {
    type: String,
    maxLength: 100
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  }
}, {
  timestamps: true,
  collection: 'complaints'
});

// Indexes (only for fields without unique: true)
complaintSchema.index({ userId: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);