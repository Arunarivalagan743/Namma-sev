const mongoose = require('mongoose');

// Gram Sabha Meetings Schema
const gramSabhaMeetingSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => require('uuid').v4()
  },
  title: {
    type: String,
    required: true,
    maxLength: 255
  },
  meetingDate: {
    type: Date,
    required: true,
    index: true
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
  description: String,
  agenda: String,
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming',
    index: true
  },
  minutesPdfUrl: {
    type: String,
    maxLength: 500
  },
  decisions: String,
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
    type: String,
    default: () => require('uuid').v4()
  },
  meetingId: {
    type: String,
    required: true,
    ref: 'GramSabhaMeeting',
    index: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  willAttend: {
    type: String,
    enum: ['yes', 'no', 'maybe'],
    required: true
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: false },
  collection: 'meeting_rsvp'
});

// Unique constraint for user-meeting combination
meetingRsvpSchema.index({ meetingId: 1, userId: 1 }, { unique: true });

const GramSabhaMeeting = mongoose.model('GramSabhaMeeting', gramSabhaMeetingSchema);
const MeetingRsvp = mongoose.model('MeetingRsvp', meetingRsvpSchema);

module.exports = { GramSabhaMeeting, MeetingRsvp };