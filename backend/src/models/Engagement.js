const mongoose = require('mongoose');

// Additional models for engagement features

// Suggestions Schema
const suggestionSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => require('uuid').v4()
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
    maxLength: 100
  },
  submittedBy: {
    type: String,
    required: true,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'approved', 'rejected', 'implemented'],
    default: 'submitted',
    index: true
  },
  adminResponse: String,
  implementationCost: Number,
  expectedBenefit: String,
  votes: {
    type: Number,
    default: 0
  },
  isAnonymous: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'suggestions'
});

// FAQ Schema
const faqSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => require('uuid').v4()
  },
  question: {
    type: String,
    required: true,
    maxLength: 500
  },
  answer: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    maxLength: 100
  },
  isPublished: {
    type: Boolean,
    default: true,
    index: true
  },
  order: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  helpfulVotes: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: String,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'faqs'
});

// Events Schema
const eventSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => require('uuid').v4()
  },
  title: {
    type: String,
    required: true,
    maxLength: 200
  },
  description: String,
  eventDate: {
    type: Date,
    required: true,
    index: true
  },
  eventTime: {
    type: String,
    maxLength: 20
  },
  venue: {
    type: String,
    maxLength: 255
  },
  category: {
    type: String,
    maxLength: 100
  },
  isPublic: {
    type: Boolean,
    default: true,
    index: true
  },
  maxAttendees: Number,
  registrationRequired: {
    type: Boolean,
    default: false
  },
  registrationDeadline: Date,
  contactInfo: String,
  imageUrl: {
    type: String,
    maxLength: 500
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming',
    index: true
  },
  createdBy: {
    type: String,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'events'
});

// Event Registration Schema
const eventRegistrationSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => require('uuid').v4()
  },
  eventId: {
    type: String,
    required: true,
    ref: 'Event',
    index: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  registrationStatus: {
    type: String,
    enum: ['registered', 'attended', 'cancelled'],
    default: 'registered'
  },
  additionalInfo: String
}, {
  timestamps: { createdAt: 'registeredAt', updatedAt: false },
  collection: 'event_registrations'
});

// Unique constraint for user-event combination
eventRegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

const Suggestion = mongoose.model('Suggestion', suggestionSchema);
const FAQ = mongoose.model('FAQ', faqSchema);
const Event = mongoose.model('Event', eventSchema);
const EventRegistration = mongoose.model('EventRegistration', eventRegistrationSchema);

module.exports = { Suggestion, FAQ, Event, EventRegistration };