// filepath: /home/cykosynergy/projects/Namma-sev/backend/src/controllers/super-admin.controller.js
const { SuperAdmin, Tenant, TenantConfig, TenantAuditLog, TenantBilling, User, Complaint } = require('../models');

/**
 * Phase 4: Super Admin Controller
 * Platform-level administration and cross-tenant management
 */

// ============ SUPER ADMIN MANAGEMENT ============

/**
 * Get all super admins
 */
const getAllSuperAdmins = async (req, res) => {
  try {
    const admins = await SuperAdmin.find()
      .select('-mfaSecret')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: { admins }
    });
  } catch (error) {
    console.error('[SuperAdminController] getAllSuperAdmins error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch super admins',
      message: error.message
    });
  }
};

/**
 * Create super admin
 */
const createSuperAdmin = async (req, res) => {
  try {
    const { firebaseUid, email, name, phone, role, regionAccess, notes } = req.body;

    if (!firebaseUid || !email || !name || !role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Check for existing
    const existing = await SuperAdmin.findByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Super admin with this email already exists'
      });
    }

    // Get permission preset for role
    const permissions = SuperAdmin.getPermissionPreset(role);

    const admin = new SuperAdmin({
      firebaseUid,
      email: email.toLowerCase(),
      name,
      phone,
      role,
      regionAccess: regionAccess || {},
      permissions,
      notes,
      createdBy: req.superAdmin.id
    });

    await admin.save();

    await TenantAuditLog.log({
      action: 'SUPER_ADMIN_ACCESS',
      actorType: 'super_admin',
      actorId: req.superAdmin.id,
      actorEmail: req.superAdmin.email,
      ip: req.ip,
      target: {
        type: 'super_admin',
        id: admin._id,
        description: `Created super admin: ${admin.email}`
      }
    });

    res.status(201).json({
      success: true,
      message: 'Super admin created successfully',
      data: { admin }
    });
  } catch (error) {
    console.error('[SuperAdminController] createSuperAdmin error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create super admin',
      message: error.message
    });
  }
};

/**
 * Update super admin
 */
const updateSuperAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const updates = req.body;

    // Protected fields
    delete updates._id;
    delete updates.firebaseUid;
    delete updates.createdAt;
    delete updates.createdBy;

    const admin = await SuperAdmin.findById(adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Super admin not found'
      });
    }

    // If role changed, update permissions to preset
    if (updates.role && updates.role !== admin.role) {
      updates.permissions = SuperAdmin.getPermissionPreset(updates.role);
    }

    Object.assign(admin, updates);
    admin.lastModifiedBy = req.superAdmin.id;

    await admin.save();

    res.json({
      success: true,
      message: 'Super admin updated successfully',
      data: { admin }
    });
  } catch (error) {
    console.error('[SuperAdminController] updateSuperAdmin error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update super admin',
      message: error.message
    });
  }
};

/**
 * Deactivate super admin
 */
const deactivateSuperAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { reason } = req.body;

    if (adminId === req.superAdmin.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot deactivate yourself'
      });
    }

    const admin = await SuperAdmin.findById(adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Super admin not found'
      });
    }

    admin.status = 'inactive';
    admin.lastModifiedBy = req.superAdmin.id;
    await admin.save();

    await TenantAuditLog.logWarning({
      action: 'SUPER_ADMIN_ACCESS',
      actorType: 'super_admin',
      actorId: req.superAdmin.id,
      actorEmail: req.superAdmin.email,
      ip: req.ip,
      target: {
        type: 'super_admin',
        id: admin._id,
        description: `Deactivated super admin: ${admin.email}`
      },
      metadata: { reason }
    });

    res.json({
      success: true,
      message: 'Super admin deactivated successfully'
    });
  } catch (error) {
    console.error('[SuperAdminController] deactivateSuperAdmin error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate super admin',
      message: error.message
    });
  }
};

// ============ PLATFORM DASHBOARD ============

/**
 * Get platform overview dashboard
 */
const getPlatformDashboard = async (req, res) => {
  try {
    const [
      tenantStats,
      userStats,
      complaintStats,
      recentActivity,
      criticalAlerts
    ] = await Promise.all([
      // Tenant statistics
      Tenant.aggregate([
        { $group: {
          _id: '$status',
          count: { $sum: 1 }
        }}
      ]),

      // User statistics (cross-tenant)
      User.aggregate([
        { $group: {
          _id: '$status',
          count: { $sum: 1 }
        }}
      ]),

      // Complaint statistics (cross-tenant)
      Complaint.aggregate([
        { $group: {
          _id: '$status',
          count: { $sum: 1 }
        }}
      ]),

      // Recent audit activity
      TenantAuditLog.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .select('action actorEmail tenantCode createdAt severity')
        .lean(),

      // Critical alerts in last 24 hours
      TenantAuditLog.getCriticalLogs(24)
    ]);

    // Format tenant stats
    const tenants = {
      total: tenantStats.reduce((sum, t) => sum + t.count, 0),
      byStatus: tenantStats.reduce((acc, t) => {
        acc[t._id] = t.count;
        return acc;
      }, {})
    };

    // Format user stats
    const users = {
      total: userStats.reduce((sum, u) => sum + u.count, 0),
      byStatus: userStats.reduce((acc, u) => {
        acc[u._id] = u.count;
        return acc;
      }, {})
    };

    // Format complaint stats
    const complaints = {
      total: complaintStats.reduce((sum, c) => sum + c.count, 0),
      byStatus: complaintStats.reduce((acc, c) => {
        acc[c._id] = c.count;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: {
        tenants,
        users,
        complaints,
        recentActivity,
        criticalAlerts,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('[SuperAdminController] getPlatformDashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform dashboard',
      message: error.message
    });
  }
};

/**
 * Get platform metrics
 */
const getPlatformMetrics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    // Calculate date range
    let startDate;
    switch (period) {
      case 'week':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const [
      newTenants,
      newUsers,
      newComplaints,
      resolvedComplaints,
      apiUsage
    ] = await Promise.all([
      Tenant.countDocuments({ createdAt: { $gte: startDate } }),
      User.countDocuments({ createdAt: { $gte: startDate } }),
      Complaint.countDocuments({ createdAt: { $gte: startDate } }),
      Complaint.countDocuments({
        status: 'resolved',
        resolvedAt: { $gte: startDate }
      }),
      TenantBilling.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: {
          _id: null,
          totalApiRequests: { $sum: '$apiUsage.totalRequests' },
          totalAICalls: { $sum: {
            $add: [
              '$aiUsage.classificationCalls',
              '$aiUsage.priorityCalls',
              '$aiUsage.duplicateCalls'
            ]
          }}
        }}
      ])
    ]);

    res.json({
      success: true,
      data: {
        period,
        startDate,
        metrics: {
          newTenants,
          newUsers,
          newComplaints,
          resolvedComplaints,
          resolutionRate: newComplaints > 0
            ? Math.round((resolvedComplaints / newComplaints) * 100)
            : 0,
          apiUsage: apiUsage[0] || { totalApiRequests: 0, totalAICalls: 0 }
        }
      }
    });
  } catch (error) {
    console.error('[SuperAdminController] getPlatformMetrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform metrics',
      message: error.message
    });
  }
};

// ============ AUDIT & COMPLIANCE ============

/**
 * Get audit logs
 */
const getAuditLogs = async (req, res) => {
  try {
    const {
      tenantId,
      action,
      severity,
      actorId,
      fromDate,
      toDate,
      page = 1,
      limit = 50
    } = req.query;

    const query = {};
    if (tenantId) query.tenantId = tenantId;
    if (action) query.action = action;
    if (severity) query.severity = severity;
    if (actorId) query['actor.id'] = actorId;
    if (fromDate) query.createdAt = { $gte: new Date(fromDate) };
    if (toDate) {
      query.createdAt = query.createdAt || {};
      query.createdAt.$lte = new Date(toDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      TenantAuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      TenantAuditLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('[SuperAdminController] getAuditLogs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs',
      message: error.message
    });
  }
};

/**
 * Get security events
 */
const getSecurityEvents = async (req, res) => {
  try {
    const { hours = 24, tenantId } = req.query;

    const events = await TenantAuditLog.getSecurityEvents(tenantId, parseInt(hours));

    res.json({
      success: true,
      data: { events }
    });
  } catch (error) {
    console.error('[SuperAdminController] getSecurityEvents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security events',
      message: error.message
    });
  }
};

// ============ BILLING & USAGE ============

/**
 * Get platform billing summary
 */
const getPlatformBillingSummary = async (req, res) => {
  try {
    const { year, month } = req.query;
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;

    const summary = await TenantBilling.getPlatformSummary(y, m);

    res.json({
      success: true,
      data: {
        period: { year: y, month: m },
        summary: summary[0] || {
          totalTenants: 0,
          totalApiRequests: 0,
          totalAICalls: 0,
          totalStorage: 0,
          totalCost: 0
        }
      }
    });
  } catch (error) {
    console.error('[SuperAdminController] getPlatformBillingSummary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch billing summary',
      message: error.message
    });
  }
};

// ============ EMERGENCY OPERATIONS ============

/**
 * Emergency suspend all features for a tenant
 */
const emergencySuspendTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { emergencyReason } = req.body;

    // This requires emergency override middleware
    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    // Suspend tenant
    await tenant.suspend(emergencyReason, req.superAdmin.id);

    // Activate all kill switches
    const config = await TenantConfig.findOne({ tenantId });
    if (config) {
      config.killSwitches = {
        allAI: true,
        notifications: true,
        imageUpload: true,
        newRegistrations: true
      };
      await config.save();
    }

    res.json({
      success: true,
      message: 'Emergency suspension applied',
      data: { tenant }
    });
  } catch (error) {
    console.error('[SuperAdminController] emergencySuspendTenant error:', error);
    res.status(500).json({
      success: false,
      error: 'Emergency suspension failed',
      message: error.message
    });
  }
};

/**
 * Global kill switch
 */
const globalKillSwitch = async (req, res) => {
  try {
    const { feature, enabled, emergencyReason } = req.body;

    if (!feature || enabled === undefined || !emergencyReason) {
      return res.status(400).json({
        success: false,
        error: 'Feature, enabled status, and reason are required'
      });
    }

    // Update all tenant configs
    const updateField = `killSwitches.${feature}`;
    const result = await TenantConfig.updateMany(
      {},
      { $set: { [updateField]: enabled } }
    );

    await TenantAuditLog.logCritical({
      action: enabled ? 'KILL_SWITCH_ACTIVATED' : 'KILL_SWITCH_DEACTIVATED',
      actorType: 'super_admin',
      actorId: req.superAdmin.id,
      actorEmail: req.superAdmin.email,
      actorRole: req.superAdmin.role,
      ip: req.ip,
      target: {
        type: 'global',
        description: `Global kill switch: ${feature}`
      },
      metadata: {
        reason: emergencyReason,
        tenantsAffected: result.modifiedCount
      },
      compliance: {
        retentionCategory: 'permanent'
      }
    });

    // Clear all caches
    const { clearTenantCache } = require('../middleware/tenant.middleware');
    const tenants = await Tenant.find().select('tenantCode');
    tenants.forEach(t => clearTenantCache(t.tenantCode));

    res.json({
      success: true,
      message: `Global kill switch ${enabled ? 'activated' : 'deactivated'} for ${feature}`,
      data: { tenantsAffected: result.modifiedCount }
    });
  } catch (error) {
    console.error('[SuperAdminController] globalKillSwitch error:', error);
    res.status(500).json({
      success: false,
      error: 'Global kill switch operation failed',
      message: error.message
    });
  }
};

module.exports = {
  // Super admin management
  getAllSuperAdmins,
  createSuperAdmin,
  updateSuperAdmin,
  deactivateSuperAdmin,

  // Platform dashboard
  getPlatformDashboard,
  getPlatformMetrics,

  // Audit & compliance
  getAuditLogs,
  getSecurityEvents,

  // Billing
  getPlatformBillingSummary,

  // Emergency operations
  emergencySuspendTenant,
  globalKillSwitch
};

