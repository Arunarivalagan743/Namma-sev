const mongoose = require('mongoose');

// News/Updates Schema
const newsSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => require('uuid').v4()
  },
  title: {
    type: String,
    required: true,
    maxLength: 255
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    maxLength: 500
  },
  category: {
    type: String,
    default: 'general',
    maxLength: 50
  },
  imageUrl: {
    type: String,
    maxLength: 500
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  isPublished: {
    type: Boolean,
    default: true,
    index: true
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'news_updates'
});

// Indexes
newsSchema.index({ isPublished: 1, publishedAt: -1 });
newsSchema.index({ category: 1 });
newsSchema.index({ isFeatured: 1 });

module.exports = mongoose.model('News', newsSchema);