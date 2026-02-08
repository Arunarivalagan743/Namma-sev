// filepath: /home/cykosynergy/projects/Namma-sev/backend/src/models/SuperAdmin.js
const mongoose = require('mongoose');

/**
 * Super Admin Schema
 * Platform-level administrators with cross-tenant access
 */
const superAdminSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => require('uuid').v4()
  },

  // Firebase authentication
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  name: {
    type: String,
    required: true,
    maxLength: 100
  },

  phone: {
    type: String,
    maxLength: 15
  },

  // Super admin role levels
  role: {
    type: String,
    required: true,
    enum: [
      'platform_owner',      // Full platform access
      'platform_admin',      // Can manage all tenants
      'regional_admin',      // Can manage tenants in specific regions
      'support_admin',       // Read-only + support actions
      'auditor'              // Read-only access for compliance
    ],
    default: 'support_admin',
    index: true
  },

  // Regional restrictions (for regional_admin role)
  regionAccess: {
    states: [{ type: String }],      // Empty = all states
    districts: [{ type: String }]     // Empty = all districts
  },

  // Specific tenant access (optional override)
  tenantAccess: {
    type: String,
    enum: ['all', 'specific', 'none'],
    default: 'all'
  },
  specificTenants: [{
    type: String,
    ref: 'Tenant'
  }],

  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    index: true
  },

  // Security
  lastLogin: { type: Date },
  lastLoginIp: { type: String },
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date },

  // MFA (future-ready)
  mfaEnabled: { type: Boolean, default: false },
  mfaSecret: { type: String },

  // Permissions granular control
  permissions: {
    // Tenant management
    canCreateTenant: { type: Boolean, default: false },
    canSuspendTenant: { type: Boolean, default: false },
    canArchiveTenant: { type: Boolean, default: false },
    canModifyTenantConfig: { type: Boolean, default: false },

    // User management
    canViewAllUsers: { type: Boolean, default: true },
    canModifyUsers: { type: Boolean, default: false },
    canImpersonateUsers: { type: Boolean, default: false },

    // Data access
    canViewAllComplaints: { type: Boolean, default: true },
    canModifyComplaints: { type: Boolean, default: false },
    canExportData: { type: Boolean, default: false },
    canDeleteData: { type: Boolean, default: false },

    // System administration
    canAccessSystemMetrics: { type: Boolean, default: true },
    canTriggerBackups: { type: Boolean, default: false },
    canModifyGlobalConfig: { type: Boolean, default: false },

    // Emergency powers
    canEmergencyOverride: { type: Boolean, default: false },
    canDisableTenantFeatures: { type: Boolean, default: false }
  },

  // Audit trail
  createdBy: { type: String },
  lastModifiedBy: { type: String },

  // Notes
  notes: { type: String, maxLength: 500 }

}, {
  timestamps: true,
  collection: 'super_admins'
});

// Indexes
superAdminSchema.index({ email: 1 });
superAdminSchema.index({ role: 1, status: 1 });

// Methods
superAdminSchema.methods.isActive = function() {
  if (this.status !== 'active') return false;
  if (this.lockedUntil && this.lockedUntil > new Date()) return false;
  return true;
};

superAdminSchema.methods.canAccessTenant = function(tenantId, tenantHierarchy = {}) {
  if (this.status !== 'active') return false;

  // Platform owner/admin can access all
  if (['platform_owner', 'platform_admin'].includes(this.role)) {
    return true;
  }

  // Support admin and auditor can access all (read-only enforced elsewhere)
  if (['support_admin', 'auditor'].includes(this.role)) {
    return true;
  }

  // Regional admin - check region access
  if (this.role === 'regional_admin') {
    if (this.regionAccess.states.length > 0 &&
        !this.regionAccess.states.includes(tenantHierarchy.state)) {
      return false;
    }
    if (this.regionAccess.districts.length > 0 &&
        !this.regionAccess.districts.includes(tenantHierarchy.district)) {
      return false;
    }
    return true;
  }

  // Specific tenant access
  if (this.tenantAccess === 'specific') {
    return this.specificTenants.includes(tenantId);
  }

  return this.tenantAccess === 'all';
};

superAdminSchema.methods.hasPermission = function(permission) {
  // Platform owner has all permissions
  if (this.role === 'platform_owner') return true;

  // Check specific permission
  return this.permissions[permission] === true;
};

superAdminSchema.methods.recordLogin = async function(ip) {
  this.lastLogin = new Date();
  this.lastLoginIp = ip;
  this.failedLoginAttempts = 0;
  this.lockedUntil = null;
  return this.save();
};

superAdminSchema.methods.recordFailedLogin = async function() {
  this.failedLoginAttempts += 1;

  // Lock after 5 failed attempts for 30 minutes
  if (this.failedLoginAttempts >= 5) {
    this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
  }

  return this.save();
};

// Statics
superAdminSchema.statics.findByFirebaseUid = function(uid) {
  return this.findOne({ firebaseUid: uid, status: 'active' });
};

superAdminSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

superAdminSchema.statics.getActiveAdmins = function() {
  return this.find({ status: 'active' }).select('-mfaSecret').sort({ name: 1 });
};

// Role-based permission presets
superAdminSchema.statics.getPermissionPreset = function(role) {
  const presets = {
    platform_owner: {
      canCreateTenant: true,
      canSuspendTenant: true,
      canArchiveTenant: true,
      canModifyTenantConfig: true,
      canViewAllUsers: true,
      canModifyUsers: true,
      canImpersonateUsers: true,
      canViewAllComplaints: true,
      canModifyComplaints: true,
      canExportData: true,
      canDeleteData: true,
      canAccessSystemMetrics: true,
      canTriggerBackups: true,
      canModifyGlobalConfig: true,
      canEmergencyOverride: true,
      canDisableTenantFeatures: true
    },
    platform_admin: {
      canCreateTenant: true,
      canSuspendTenant: true,
      canArchiveTenant: false,
      canModifyTenantConfig: true,
      canViewAllUsers: true,
      canModifyUsers: true,
      canImpersonateUsers: false,
      canViewAllComplaints: true,
      canModifyComplaints: true,
      canExportData: true,
      canDeleteData: false,
      canAccessSystemMetrics: true,
      canTriggerBackups: true,
      canModifyGlobalConfig: false,
      canEmergencyOverride: false,
      canDisableTenantFeatures: true
    },
    regional_admin: {
      canCreateTenant: false,
      canSuspendTenant: false,
      canArchiveTenant: false,
      canModifyTenantConfig: true,
      canViewAllUsers: true,
      canModifyUsers: true,
      canImpersonateUsers: false,
      canViewAllComplaints: true,
      canModifyComplaints: true,
      canExportData: true,
      canDeleteData: false,
      canAccessSystemMetrics: true,
      canTriggerBackups: false,
      canModifyGlobalConfig: false,
      canEmergencyOverride: false,
      canDisableTenantFeatures: false
    },
    support_admin: {
      canCreateTenant: false,
      canSuspendTenant: false,
      canArchiveTenant: false,
      canModifyTenantConfig: false,
      canViewAllUsers: true,
      canModifyUsers: false,
      canImpersonateUsers: false,
      canViewAllComplaints: true,
      canModifyComplaints: false,
      canExportData: false,
      canDeleteData: false,
      canAccessSystemMetrics: true,
      canTriggerBackups: false,
      canModifyGlobalConfig: false,
      canEmergencyOverride: false,
      canDisableTenantFeatures: false
    },
    auditor: {
      canCreateTenant: false,
      canSuspendTenant: false,
      canArchiveTenant: false,
      canModifyTenantConfig: false,
      canViewAllUsers: true,
      canModifyUsers: false,
      canImpersonateUsers: false,
      canViewAllComplaints: true,
      canModifyComplaints: false,
      canExportData: true,
      canDeleteData: false,
      canAccessSystemMetrics: true,
      canTriggerBackups: false,
      canModifyGlobalConfig: false,
      canEmergencyOverride: false,
      canDisableTenantFeatures: false
    }
  };

  return presets[role] || presets.support_admin;
};

module.exports = mongoose.model('SuperAdmin', superAdminSchema);

