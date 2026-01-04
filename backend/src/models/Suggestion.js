const mongoose = require('mongoose');

// Public Suggestion Schema
const publicSuggestionSchema = new mongoose.Schema({
  _id: {
    type: Number,
    default: () => Math.floor(Math.random() * 1000000)
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    required: true,
    maxLength: 255
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['development', 'infrastructure', 'environment', 'education', 'health', 'transport', 'other'],
    default: 'other'
  },
  location: {
    type: String,
    maxLength: 255
  },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'under_review', 'approved', 'implemented', 'rejected'],
    default: 'pending'
  },
  adminRemarks: {
    type: String
  },
  imageUrl: {
    type: String
  },
  upvotes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'public_suggestions'
});

// Suggestion Upvote Schema
const suggestionUpvoteSchema = new mongoose.Schema({
  _id: {
    type: Number,
    default: () => Math.floor(Math.random() * 1000000)
  },
  suggestionId: {
    type: Number,
    required: true,
    ref: 'PublicSuggestion'
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  }
}, {
  timestamps: { 
    createdAt: 'createdAt',
    updatedAt: false 
  },
  collection: 'suggestion_upvotes'
});

// Indexes
suggestionUpvoteSchema.index({ suggestionId: 1, userId: 1 }, { unique: true });

const PublicSuggestion = mongoose.model('PublicSuggestion', publicSuggestionSchema);
const SuggestionUpvote = mongoose.model('SuggestionUpvote', suggestionUpvoteSchema);

module.exports = {
  PublicSuggestion,
  SuggestionUpvote
};