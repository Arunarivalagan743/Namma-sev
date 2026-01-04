const mongoose = require('mongoose');

// Community Event Schema
const communityEventSchema = new mongoose.Schema({
  _id: {
    type: Number,
    default: () => Math.floor(Math.random() * 1000000)
  },
  title: {
    type: String,
    required: true,
    maxLength: 255
  },
  description: {
    type: String
  },
  eventType: {
    type: String,
    enum: ['health_camp', 'vaccination', 'awareness', 'training', 'cultural', 'sports', 'educational', 'religious', 'other'],
    default: 'other'
  },
  eventDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    maxLength: 20
  },
  endTime: {
    type: String,
    maxLength: 20
  },
  endDate: {
    type: Date
  },
  venue: {
    type: String,
    required: true,
    maxLength: 255
  },
  organizer: {
    type: String,
    maxLength: 255
  },
  contactInfo: {
    type: String,
    maxLength: 255
  },
  imageUrl: {
    type: String,
    maxLength: 500
  },
  isFree: {
    type: Boolean,
    default: true
  },
  registrationRequired: {
    type: Boolean,
    default: false
  },
  maxParticipants: {
    type: Number
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  createdBy: {
    type: String,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'community_events'
});

const CommunityEvent = mongoose.model('CommunityEvent', communityEventSchema);

module.exports = { CommunityEvent };