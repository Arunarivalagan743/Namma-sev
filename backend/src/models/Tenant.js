// filepath: /home/cykosynergy/projects/Namma-sev/backend/src/models/Tenant.js
const mongoose = require('mongoose');

/**
 * Tenant Schema
 * Represents a Panchayat, Block, or District in the multi-tenant system
 */
const tenantSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => require('uuid').v4()
  },

  // Unique tenant identifier (e.g., 'TIRU001', 'COIMB002')
  tenantCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxLength: 20,
    match: [/^[A-Z0-9_]+$/, 'Tenant code must be alphanumeric uppercase']
  },

  // Official name
  name: {
    type: String,
    required: true,
    maxLength: 200
  },

  // Type of administrative unit
  type: {
    type: String,
    required: true,
    enum: ['panchayat', 'block', 'taluk', 'district', 'municipality', 'corporation']
  },

  // Geographic hierarchy
  hierarchy: {
    state: { type: String, required: true, maxLength: 100 },
    district: { type: String, required: true, maxLength: 100 },
    taluk: { type: String, maxLength: 100 },
    block: { type: String, maxLength: 100 }
  },

  // Lifecycle status
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'archived'],
    default: 'pending'
  },

  // Activation details
  activatedAt: { type: Date },
  suspendedAt: { type: Date },
  suspendedReason: { type: String },
  archivedAt: { type: Date },

  // Primary admin user
  primaryAdminId: {
    type: String,
    ref: 'User'
  },

  // Contact information
  contact: {
    officialEmail: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    pincode: { type: String, maxLength: 10 }
  },

  // Subscription & limits
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'standard', 'premium', 'enterprise'],
      default: 'basic'
    },
    maxUsers: { type: Number, default: 500 },
    maxComplaints: { type: Number, default: 10000 },
    maxStorageMB: { type: Number, default: 1024 },
    expiresAt: { type: Date }
  },

  // Data governance
  dataGovernance: {
    region: {
      type: String,
      default: 'ap-south-1',  // Mumbai region default for India
      enum: ['ap-south-1', 'ap-southeast-1', 'eu-west-1', 'us-east-1']
    },
    retentionDays: { type: Number, default: 2555 }, // ~7 years
    backupEnabled: { type: Boolean, default: true },
    encryptionKeyId: { type: String }
  },

  // Audit metadata
  createdBy: { type: String, ref: 'SuperAdmin' },
  lastModifiedBy: { type: String },

  // Statistics (updated periodically)
  stats: {
    totalUsers: { type: Number, default: 0 },
    totalComplaints: { type: Number, default: 0 },
    activeComplaints: { type: Number, default: 0 },
    resolvedComplaints: { type: Number, default: 0 },
    lastActivity: { type: Date }
  }

}, {
  timestamps: true,
  collection: 'tenants'
});

// Compound indexes for efficient querying
tenantSchema.index({ status: 1, type: 1 });
tenantSchema.index({ 'hierarchy.state': 1, 'hierarchy.district': 1 });
tenantSchema.index({ 'subscription.plan': 1 });
tenantSchema.index({ createdAt: -1 });

// Virtual for display name with hierarchy
tenantSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.hierarchy.district}, ${this.hierarchy.state})`;
});

// Methods
tenantSchema.methods.isActive = function() {
  return this.status === 'active';
};

tenantSchema.methods.isWithinLimits = function(currentUsers, currentComplaints) {
  return currentUsers <= this.subscription.maxUsers &&
         currentComplaints <= this.subscription.maxComplaints;
};

tenantSchema.methods.suspend = async function(reason, suspendedBy) {
  this.status = 'suspended';
  this.suspendedAt = new Date();
  this.suspendedReason = reason;
  this.lastModifiedBy = suspendedBy;
  return this.save();
};

tenantSchema.methods.activate = async function(activatedBy) {
  this.status = 'active';
  this.activatedAt = new Date();
  this.suspendedAt = null;
  this.suspendedReason = null;
  this.lastModifiedBy = activatedBy;
  return this.save();
};

tenantSchema.methods.archive = async function(archivedBy) {
  this.status = 'archived';
  this.archivedAt = new Date();
  this.lastModifiedBy = archivedBy;
  return this.save();
};

// Statics
tenantSchema.statics.findByCode = function(tenantCode) {
  return this.findOne({ tenantCode: tenantCode.toUpperCase() });
};

tenantSchema.statics.getActiveTenants = function() {
  return this.find({ status: 'active' }).sort({ name: 1 });
};

tenantSchema.statics.getByRegion = function(state, district = null) {
  const query = { 'hierarchy.state': state, status: 'active' };
  if (district) query['hierarchy.district'] = district;
  return this.find(query).sort({ name: 1 });
};

module.exports = mongoose.model('Tenant', tenantSchema);

