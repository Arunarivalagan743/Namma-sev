const mongoose = require('mongoose');

// Government Schemes Schema
const governmentSchemeSchema = new mongoose.Schema({
  _id: {
    type: Number,
    default: () => Math.floor(Math.random() * 1000000)
  },
  name: {
    type: String,
    required: true,
    maxLength: 255
  },
  description: {
    type: String,
    required: true
  },
  eligibility: {
    type: String
  },
  documentsRequired: {
    type: String
  },
  benefits: {
    type: String
  },
  lastDate: {
    type: Date
  },
  category: {
    type: String,
    enum: ['agriculture', 'education', 'health', 'housing', 'women', 'senior_citizen', 'employment', 'central', 'state', 'local', 'other'],
    default: 'other'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicationLink: {
    type: String,
    maxLength: 500
  },
  createdBy: {
    type: String,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'government_schemes'
});

// Scheme Bookmarks Schema
const schemeBookmarkSchema = new mongoose.Schema({
  _id: {
    type: Number,
    default: () => Math.floor(Math.random() * 1000000)
  },
  schemeId: {
    type: Number,
    required: true,
    ref: 'GovernmentScheme'
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
  collection: 'scheme_bookmarks'
});

// Indexes
schemeBookmarkSchema.index({ schemeId: 1, userId: 1 }, { unique: true });

const GovernmentScheme = mongoose.model('GovernmentScheme', governmentSchemeSchema);
const SchemeBookmark = mongoose.model('SchemeBookmark', schemeBookmarkSchema);

module.exports = {
  GovernmentScheme,
  SchemeBookmark
};