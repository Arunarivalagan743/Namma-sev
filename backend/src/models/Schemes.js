const mongoose = require('mongoose');

// Schemes Schema
const schemeSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => require('uuid').v4()
  },
  name: {
    type: String,
    required: true,
    maxLength: 200
  },
  description: String,
  category: {
    type: String,
    maxLength: 100
  },
  eligibilityCriteria: String,
  applicationProcess: String,
  requiredDocuments: [String],
  benefits: String,
  applicationDeadline: Date,
  startDate: Date,
  endDate: Date,
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active',
    index: true
  },
  contactInfo: String,
  websiteUrl: {
    type: String,
    maxLength: 500
  },
  documentUrl: {
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

// Budget Information Schema
const budgetInfoSchema = new mongoose.Schema({
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
  category: {
    type: String,
    required: true,
    maxLength: 100
  },
  allocatedAmount: {
    type: Number,
    required: true
  },
  spentAmount: {
    type: Number,
    default: 0
  },
  financialYear: {
    type: String,
    required: true,
    maxLength: 10
  },
  quarterPeriod: {
    type: String,
    maxLength: 10
  },
  isPublic: {
    type: Boolean,
    default: true,
    index: true
  },
  documentUrl: {
    type: String,
    maxLength: 500
  },
  createdBy: {
    type: String,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'budget_information'
});

// Public Works Schema
const publicWorkSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => require('uuid').v4()
  },
  projectName: {
    type: String,
    required: true,
    maxLength: 200
  },
  description: String,
  category: {
    type: String,
    required: true,
    maxLength: 100
  },
  location: {
    type: String,
    maxLength: 255
  },
  estimatedCost: Number,
  actualCost: Number,
  startDate: Date,
  expectedCompletionDate: Date,
  actualCompletionDate: Date,
  status: {
    type: String,
    enum: ['planned', 'approved', 'in_progress', 'completed', 'cancelled'],
    default: 'planned',
    index: true
  },
  contractorName: {
    type: String,
    maxLength: 100
  },
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  imageUrls: [String],
  createdBy: {
    type: String,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'public_works'
});

const Scheme = mongoose.model('Scheme', schemeSchema);
const BudgetInfo = mongoose.model('BudgetInfo', budgetInfoSchema);
const PublicWork = mongoose.model('PublicWork', publicWorkSchema);

module.exports = { Scheme, BudgetInfo, PublicWork };