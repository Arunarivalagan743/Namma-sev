const mongoose = require('mongoose');

// Polls Schema
const pollSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => require('uuid').v4()
  },
  question: {
    type: String,
    required: true,
    maxLength: 500
  },
  description: String,
  status: {
    type: String,
    enum: ['draft', 'active', 'closed'],
    default: 'active',
    index: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  allowMultiple: {
    type: Boolean,
    default: false
  },
  startsAt: {
    type: Date,
    default: Date.now
  },
  endsAt: {
    type: Date,
    index: true
  },
  createdBy: {
    type: String,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'polls'
});

// Poll Options Schema
const pollOptionSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => require('uuid').v4()
  },
  pollId: {
    type: String,
    required: true,
    ref: 'Poll',
    index: true
  },
  optionText: {
    type: String,
    required: true,
    maxLength: 200
  },
  voteCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: false },
  collection: 'poll_options'
});

// Poll Votes Schema
const pollVoteSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => require('uuid').v4()
  },
  pollId: {
    type: String,
    required: true,
    ref: 'Poll',
    index: true
  },
  optionId: {
    type: String,
    required: true,
    ref: 'PollOption',
    index: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  ipAddress: {
    type: String,
    maxLength: 45
  }
}, {
  timestamps: { createdAt: 'votedAt', updatedAt: false },
  collection: 'poll_votes'
});

// Unique constraint for user-poll combination (if not allowing multiple votes)
pollVoteSchema.index({ pollId: 1, userId: 1 }, { unique: true });

const Poll = mongoose.model('Poll', pollSchema);
const PollOption = mongoose.model('PollOption', pollOptionSchema);
const PollVote = mongoose.model('PollVote', pollVoteSchema);

module.exports = { Poll, PollOption, PollVote };