// filepath: /home/cykosynergy/projects/Namma-sev/backend/src/models/TenantAuditLog.js
const mongoose = require('mongoose');

/**
 * Tenant Audit Log Schema
 * Comprehensive audit trail for compliance and security
 */
const tenantAuditLogSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => require('uuid').v4()
  },

  // Tenant context
  tenantId: {
    type: String,
    ref: 'Tenant',
    index: true
  },
  tenantCode: {
    type: String,
    index: true
  },

  // Action details
  action: {
    type: String,
    required: true,
    enum: [
      // Tenant lifecycle
      'TENANT_CREATED',
      'TENANT_ACTIVATED',
      'TENANT_SUSPENDED',
      'TENANT_ARCHIVED',
      'TENANT_CONFIG_UPDATED',

      // User actions
      'USER_REGISTERED',
      'USER_APPROVED',
      'USER_REJECTED',
      'USER_DELETED',
      'USER_DATA_EXPORTED',
      'USER_DATA_DELETED',

      // Complaint actions
      'COMPLAINT_CREATED',
      'COMPLAINT_STATUS_CHANGED',
      'COMPLAINT_ASSIGNED',
      'COMPLAINT_RESOLVED',
      'COMPLAINT_DELETED',

      // Admin actions
      'ADMIN_LOGIN',
      'ADMIN_LOGOUT',
      'ADMIN_IMPERSONATION',
      'BULK_OPERATION',
      'DATA_EXPORT',
      'DATA_IMPORT',

      // Super admin actions
      'SUPER_ADMIN_ACCESS',
      'EMERGENCY_OVERRIDE',
      'FEATURE_FLAG_CHANGED',
      'KILL_SWITCH_ACTIVATED',
      'KILL_SWITCH_DEACTIVATED',

      // System actions
      'BACKUP_TRIGGERED',
      'BACKUP_COMPLETED',
      'RESTORE_INITIATED',
      'RESTORE_COMPLETED',
      'CLEANUP_EXECUTED',

      // Compliance actions
      'RTI_REQUEST_RECEIVED',
      'RTI_DATA_PROVIDED',
      'CONSENT_RECORDED',
      'CONSENT_WITHDRAWN',
      'DELETION_REQUEST',
      'DELETION_COMPLETED',

      // Security events
      'LOGIN_FAILED',
      'ACCOUNT_LOCKED',
      'SUSPICIOUS_ACTIVITY',
      'CROSS_TENANT_ATTEMPT'
    ],
    index: true
  },

  // Actor information
  actor: {
    type: {
      type: String,
      enum: ['user', 'admin', 'super_admin', 'system'],
      required: true
    },
    id: { type: String },
    email: { type: String },
    name: { type: String },
    role: { type: String },
    ip: { type: String },
    userAgent: { type: String }
  },

  // Target resource
  target: {
    type: { type: String }, // 'user', 'complaint', 'announcement', etc.
    id: { type: String },
    description: { type: String }
  },

  // Change details
  changes: {
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed },
    fields: [{ type: String }]
  },

  // Additional context
  metadata: {
    reason: { type: String },
    notes: { type: String },
    requestId: { type: String },
    sessionId: { type: String },
    source: { type: String }, // 'web', 'api', 'admin_panel', 'system'
    success: { type: Boolean, default: true },
    errorMessage: { type: String }
  },

  // Compliance metadata
  compliance: {
    isRTIRelated: { type: Boolean, default: false },
    isDPDPRelated: { type: Boolean, default: false },
    retentionCategory: {
      type: String,
      enum: ['standard', 'extended', 'permanent'],
      default: 'standard'
    }
  },

  // Severity for alerting
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info',
    index: true
  }

}, {
  timestamps: true,
  collection: 'tenant_audit_logs'
});

// Compound indexes for efficient querying
tenantAuditLogSchema.index({ tenantId: 1, createdAt: -1 });
tenantAuditLogSchema.index({ action: 1, createdAt: -1 });
tenantAuditLogSchema.index({ 'actor.id': 1, createdAt: -1 });
tenantAuditLogSchema.index({ 'target.id': 1, createdAt: -1 });
tenantAuditLogSchema.index({ severity: 1, createdAt: -1 });
tenantAuditLogSchema.index({ createdAt: -1 }); // For time-based queries

// TTL index for automatic cleanup (configurable per retention category)
// Standard: 7 years, Extended: 10 years, Permanent: no TTL
// Note: Actual TTL is managed via application logic based on compliance settings

// Statics
tenantAuditLogSchema.statics.log = async function(data) {
  try {
    const log = new this({
      tenantId: data.tenantId,
      tenantCode: data.tenantCode,
      action: data.action,
      actor: {
        type: data.actorType || 'system',
        id: data.actorId,
        email: data.actorEmail,
        name: data.actorName,
        role: data.actorRole,
        ip: data.ip,
        userAgent: data.userAgent
      },
      target: data.target,
      changes: data.changes,
      metadata: {
        reason: data.reason,
        notes: data.notes,
        requestId: data.requestId,
        sessionId: data.sessionId,
        source: data.source || 'api',
        success: data.success !== false,
        errorMessage: data.errorMessage
      },
      compliance: {
        isRTIRelated: data.isRTIRelated || false,
        isDPDPRelated: data.isDPDPRelated || false,
        retentionCategory: data.retentionCategory || 'standard'
      },
      severity: data.severity || 'info'
    });

    return await log.save();
  } catch (error) {
    console.error('[AuditLog] Failed to create log:', error.message);
    // Don't throw - audit logging should not break application flow
    return null;
  }
};

tenantAuditLogSchema.statics.logCritical = async function(data) {
  return this.log({ ...data, severity: 'critical' });
};

tenantAuditLogSchema.statics.logWarning = async function(data) {
  return this.log({ ...data, severity: 'warning' });
};

// Query helpers
tenantAuditLogSchema.statics.getByTenant = function(tenantId, options = {}) {
  const query = { tenantId };
  if (options.action) query.action = options.action;
  if (options.severity) query.severity = options.severity;
  if (options.fromDate) query.createdAt = { $gte: options.fromDate };
  if (options.toDate) {
    query.createdAt = query.createdAt || {};
    query.createdAt.$lte = options.toDate;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 100);
};

tenantAuditLogSchema.statics.getByActor = function(actorId, options = {}) {
  return this.find({ 'actor.id': actorId })
    .sort({ createdAt: -1 })
    .limit(options.limit || 100);
};

tenantAuditLogSchema.statics.getCriticalLogs = function(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({
    severity: 'critical',
    createdAt: { $gte: since }
  }).sort({ createdAt: -1 });
};

tenantAuditLogSchema.statics.getSecurityEvents = function(tenantId, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const securityActions = [
    'LOGIN_FAILED', 'ACCOUNT_LOCKED', 'SUSPICIOUS_ACTIVITY',
    'CROSS_TENANT_ATTEMPT', 'EMERGENCY_OVERRIDE'
  ];

  const query = {
    action: { $in: securityActions },
    createdAt: { $gte: since }
  };
  if (tenantId) query.tenantId = tenantId;

  return this.find(query).sort({ createdAt: -1 });
};

// Compliance exports
tenantAuditLogSchema.statics.exportForRTI = async function(tenantId, fromDate, toDate) {
  return this.find({
    tenantId,
    createdAt: { $gte: fromDate, $lte: toDate }
  })
  .select('-_id action actor.email actor.name target changes.fields metadata.reason createdAt')
  .sort({ createdAt: 1 })
  .lean();
};

tenantAuditLogSchema.statics.getUserActivityReport = async function(userId, tenantId) {
  return this.find({
    tenantId,
    $or: [
      { 'actor.id': userId },
      { 'target.id': userId }
    ]
  })
  .select('-_id action target createdAt')
  .sort({ createdAt: -1 })
  .limit(1000)
  .lean();
};

module.exports = mongoose.model('TenantAuditLog', tenantAuditLogSchema);

