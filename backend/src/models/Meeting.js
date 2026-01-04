const mongoose = require('mongoose');

// Gram Sabha Meetings Schema
const gramSabhaMeetingSchema = new mongoose.Schema({
  _id: {
    type: Number,
    default: () => Math.floor(Math.random() * 1000000)
  },
  title: {
    type: String,
    required: true,
    maxLength: 255
  },
  meetingDate: {
    type: Date,
    required: true
  },
  meetingTime: {
    type: String,
    maxLength: 20
  },
  venue: {
    type: String,
    required: true,
    maxLength: 255
  },
  description: {
    type: String
  },
  agenda: {
    type: String
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  minutesPdfUrl: {
    type: String,
    maxLength: 500
  },
  decisions: {
    type: String
  },
  attendanceCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: String,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'gram_sabha_meetings'
});

// Meeting RSVP Schema
const meetingRsvpSchema = new mongoose.Schema({
  _id: {
    type: Number,
    default: () => Math.floor(Math.random() * 1000000)
  },
  meetingId: {
    type: Number,
    required: true,
    ref: 'GramSabhaMeeting'
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  willAttend: {
    type: String,
    enum: ['yes', 'no', 'maybe'],
    required: true
  }
}, {
  timestamps: { 
    createdAt: 'createdAt',
    updatedAt: false 
  },
  collection: 'meeting_rsvp'
});

// Indexes
meetingRsvpSchema.index({ meetingId: 1, userId: 1 }, { unique: true });

const GramSabhaMeeting = mongoose.model('GramSabhaMeeting', gramSabhaMeetingSchema);
const MeetingRsvp = mongoose.model('MeetingRsvp', meetingRsvpSchema);

module.exports = {
  GramSabhaMeeting,
  MeetingRsvp
};