const mongoose = require('mongoose');

// FAQ Schema
const faqSchema = new mongoose.Schema({
  _id: {
    type: Number,
    default: () => Math.floor(Math.random() * 1000000)
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
    enum: ['general', 'complaints', 'schemes', 'documents', 'services', 'meetings', 'taxes', 'technical'],
    default: 'general'
  },
  displayOrder: {
    type: Number,
    default: 0
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
  collection: 'faqs'
});

// News Update Schema
const newsUpdateSchema = new mongoose.Schema({
  _id: {
    type: Number,
    default: () => Math.floor(Math.random() * 1000000)
  },
  title: {
    type: String,
    required: true,
    maxLength: 255
  },
  content: {
    type: String
  },
  summary: {
    type: String,
    maxLength: 500
  },
  category: {
    type: String,
    enum: ['notice', 'meeting', 'development', 'scheme', 'event', 'announcement', 'general'],
    default: 'general'
  },
  imageUrl: {
    type: String,
    maxLength: 500
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  publishedAt: {
    type: Date
  },
  createdBy: {
    type: String,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'news_updates'
});

const FAQ = mongoose.model('FAQ', faqSchema);
const NewsUpdate = mongoose.model('NewsUpdate', newsUpdateSchema);

module.exports = {
  FAQ,
  NewsUpdate
};