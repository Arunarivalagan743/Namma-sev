const mongoose = require('mongoose');

// Emergency Alert Schema
const emergencyAlertSchema = new mongoose.Schema({
  _id: {
    type: Number,
    default: () => Math.floor(Math.random() * 1000000)
  },
  title: {
    type: String,
    required: true,
    maxLength: 255
  },
  message: {
    type: String,
    required: true
  },
  alertType: {
    type: String,
    enum: ['weather', 'flood', 'water_contamination', 'road_block', 'power_outage', 'health', 'general'],
    default: 'general'
  },
  severity: {
    type: String,
    enum: ['info', 'low', 'medium', 'warning', 'high', 'danger', 'critical'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date
  },
  affectedAreas: {
    type: String,
    maxLength: 500
  },
  instructions: {
    type: String
  },
  createdBy: {
    type: String,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'emergency_alerts'
});

const EmergencyAlert = mongoose.model('EmergencyAlert', emergencyAlertSchema);

module.exports = { EmergencyAlert };