const mongoose = require('mongoose');

// Panchayat Work Schema
const panchayatWorkSchema = new mongoose.Schema({
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
  workType: {
    type: String,
    enum: ['road', 'drainage', 'building', 'water', 'water_supply', 'electricity', 'sanitation', 'park', 'other'],
    default: 'other'
  },
  location: {
    type: String,
    required: true,
    maxLength: 255
  },
  contractor: {
    type: String,
    maxLength: 255
  },
  budgetAmount: {
    type: Number
  },
  startDate: {
    type: Date
  },
  expectedCompletion: {
    type: Date
  },
  actualCompletion: {
    type: Date
  },
  progressPercentage: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'delayed', 'cancelled'],
    default: 'planned'
  },
  createdBy: {
    type: String,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'panchayat_works'
});

// Work Progress Update Schema
const workProgressUpdateSchema = new mongoose.Schema({
  _id: {
    type: Number,
    default: () => Math.floor(Math.random() * 1000000)
  },
  workId: {
    type: Number,
    required: true,
    ref: 'PanchayatWork'
  },
  updateText: {
    type: String,
    required: true
  },
  progressPercentage: {
    type: Number
  },
  imageUrl: {
    type: String,
    maxLength: 500
  },
  updatedBy: {
    type: String,
    ref: 'User'
  }
}, {
  timestamps: { 
    createdAt: 'createdAt',
    updatedAt: false 
  },
  collection: 'work_progress_updates'
});

const PanchayatWork = mongoose.model('PanchayatWork', panchayatWorkSchema);
const WorkProgressUpdate = mongoose.model('WorkProgressUpdate', workProgressUpdateSchema);

module.exports = {
  PanchayatWork,
  WorkProgressUpdate
};