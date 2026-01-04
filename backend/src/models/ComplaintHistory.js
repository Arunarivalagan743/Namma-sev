const mongoose = require('mongoose');

// Complaint History Schema
const complaintHistorySchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => require('uuid').v4()
  },
  complaintId: {
    type: String,
    required: true,
    ref: 'Complaint',
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'in_progress', 'resolved', 'rejected']
  },
  remarks: {
    type: String
  },
  adminId: {
    type: String,
    ref: 'User'
  }
}, {
  timestamps: { 
    createdAt: 'createdAt',
    updatedAt: false 
  },
  collection: 'complaint_history'
});

// Indexes
complaintHistorySchema.index({ complaintId: 1 });
complaintHistorySchema.index({ createdAt: -1 });

module.exports = mongoose.model('ComplaintHistory', complaintHistorySchema);