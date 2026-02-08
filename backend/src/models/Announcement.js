const mongoose = require('mongoose');

// Announcement Schema
const announcementSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => require('uuid').v4()
  },
  title: {
    type: String,
    required: true,
    maxLength: 200
  },
  content: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'announcements'
});

// Indexes
announcementSchema.index({ isActive: 1 });
announcementSchema.index({ priority: -1 });
announcementSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);