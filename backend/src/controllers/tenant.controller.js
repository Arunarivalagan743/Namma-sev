// filepath: /home/cykosynergy/projects/Namma-sev/backend/src/controllers/tenant.controller.js
const { Tenant, TenantConfig, TenantAuditLog, TenantBilling, User } = require('../models');

/**
 * Phase 4: Tenant Controller
 * Manages tenant CRUD operations and configuration
 */

/**
 * Get all tenants (super admin)
 */
const getAllTenants = async (req, res) => {
  try {
    const { status, type, state, district, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (state) query['hierarchy.state'] = state;
    if (district) query['hierarchy.district'] = district;

    // Apply regional restrictions for regional admins
    if (req.superAdmin.role === 'regional_admin') {
      if (req.superAdmin.regionAccess.states?.length > 0) {
        query['hierarchy.state'] = { $in: req.superAdmin.regionAccess.states };
      }
      if (req.superAdmin.regionAccess.districts?.length > 0) {
        query['hierarchy.district'] = { $in: req.superAdmin.regionAccess.districts };
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tenants, total] = await Promise.all([
      Tenant.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Tenant.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        tenants,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('[TenantController] getAllTenants error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tenants',
      message: error.message
    });
  }
};

/**
 * Get single tenant by ID
 */
const getTenantById = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const tenant = await Tenant.findById(tenantId).lean();

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    // Get associated config
    const config = await TenantConfig.findOne({ tenantId }).lean();

    // Get usage stats
    const userCount = await User.countDocuments({ panchayatCode: tenant.tenantCode });

    res.json({
      success: true,
      data: {
        tenant,
        config,
        usage: {
          users: userCount
        }
      }
    });
  } catch (error) {
    console.error('[TenantController] getTenantById error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tenant',
      message: error.message
    });
  }
};

/**
 * Create new tenant
 */
const createTenant = async (req, res) => {
  try {
    const {
      tenantCode,
      name,
      type,
      hierarchy,
      contact,
      subscription
    } = req.body;

    // Validate required fields
    if (!tenantCode || !name || !type || !hierarchy?.state || !hierarchy?.district) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'tenantCode, name, type, state, and district are required'
      });
    }

    // Check for duplicate tenant code
    const existing = await Tenant.findByCode(tenantCode);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Tenant code already exists',
        message: `A tenant with code ${tenantCode} already exists`
      });
    }

    // Create tenant
    const tenant = new Tenant({
      tenantCode: tenantCode.toUpperCase(),
      name,
      type,
      hierarchy,
      contact,
      subscription: subscription || {},
      status: 'pending',
      createdBy: req.superAdmin.id
    });

    await tenant.save();

    // Create default config
    const config = await TenantConfig.createDefault(tenant._id, tenant.tenantCode);

    // Log creation
    await TenantAuditLog.log({
      tenantId: tenant._id,
      tenantCode: tenant.tenantCode,
      action: 'TENANT_CREATED',
      actorType: 'super_admin',
      actorId: req.superAdmin.id,
      actorEmail: req.superAdmin.email,
      actorRole: req.superAdmin.role,
      ip: req.ip,
      target: {
        type: 'tenant',
        id: tenant._id,
        description: tenant.name
      },
      changes: {
        after: tenant.toObject()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Tenant created successfully',
      data: {
        tenant,
        config
      }
    });
  } catch (error) {
    console.error('[TenantController] createTenant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create tenant',
      message: error.message
    });
  }
};

/**
 * Update tenant
 */
const updateTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const updates = req.body;

    // Fields that cannot be updated
    delete updates._id;
    delete updates.tenantCode;
    delete updates.createdAt;
    delete updates.createdBy;

    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    const beforeData = tenant.toObject();

    // Apply updates
    Object.assign(tenant, updates);
    tenant.lastModifiedBy = req.superAdmin.id;

    await tenant.save();

    // Log update
    await TenantAuditLog.log({
      tenantId: tenant._id,
      tenantCode: tenant.tenantCode,
      action: 'TENANT_CONFIG_UPDATED',
      actorType: 'super_admin',
      actorId: req.superAdmin.id,
      actorEmail: req.superAdmin.email,
      actorRole: req.superAdmin.role,
      ip: req.ip,
      changes: {
        before: beforeData,
        after: tenant.toObject(),
        fields: Object.keys(updates)
      }
    });

    res.json({
      success: true,
      message: 'Tenant updated successfully',
      data: { tenant }
    });
  } catch (error) {
    console.error('[TenantController] updateTenant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update tenant',
      message: error.message
    });
  }
};

/**
 * Activate tenant
 */
const activateTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    if (tenant.status === 'active') {
      return res.status(400).json({
        success: false,
        error: 'Tenant already active'
      });
    }

    await tenant.activate(req.superAdmin.id);

    await TenantAuditLog.log({
      tenantId: tenant._id,
      tenantCode: tenant.tenantCode,
      action: 'TENANT_ACTIVATED',
      actorType: 'super_admin',
      actorId: req.superAdmin.id,
      actorEmail: req.superAdmin.email,
      actorRole: req.superAdmin.role,
      ip: req.ip,
      target: {
        type: 'tenant',
        id: tenant._id,
        description: tenant.name
      }
    });

    res.json({
      success: true,
      message: 'Tenant activated successfully',
      data: { tenant }
    });
  } catch (error) {
    console.error('[TenantController] activateTenant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate tenant',
      message: error.message
    });
  }
};

/**
 * Suspend tenant
 */
const suspendTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Suspension reason is required'
      });
    }

    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    if (tenant.status === 'suspended') {
      return res.status(400).json({
        success: false,
        error: 'Tenant already suspended'
      });
    }

    await tenant.suspend(reason, req.superAdmin.id);

    await TenantAuditLog.logCritical({
      tenantId: tenant._id,
      tenantCode: tenant.tenantCode,
      action: 'TENANT_SUSPENDED',
      actorType: 'super_admin',
      actorId: req.superAdmin.id,
      actorEmail: req.superAdmin.email,
      actorRole: req.superAdmin.role,
      ip: req.ip,
      target: {
        type: 'tenant',
        id: tenant._id,
        description: tenant.name
      },
      metadata: {
        reason
      }
    });

    res.json({
      success: true,
      message: 'Tenant suspended successfully',
      data: { tenant }
    });
  } catch (error) {
    console.error('[TenantController] suspendTenant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suspend tenant',
      message: error.message
    });
  }
};

/**
 * Archive tenant
 */
const archiveTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Archive reason is required'
      });
    }

    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    await tenant.archive(req.superAdmin.id);

    await TenantAuditLog.logCritical({
      tenantId: tenant._id,
      tenantCode: tenant.tenantCode,
      action: 'TENANT_ARCHIVED',
      actorType: 'super_admin',
      actorId: req.superAdmin.id,
      actorEmail: req.superAdmin.email,
      actorRole: req.superAdmin.role,
      ip: req.ip,
      target: {
        type: 'tenant',
        id: tenant._id,
        description: tenant.name
      },
      metadata: {
        reason
      },
      compliance: {
        retentionCategory: 'permanent'
      }
    });

    res.json({
      success: true,
      message: 'Tenant archived successfully',
      data: { tenant }
    });
  } catch (error) {
    console.error('[TenantController] archiveTenant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to archive tenant',
      message: error.message
    });
  }
};

/**
 * Get tenant configuration
 */
const getTenantConfig = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const config = await TenantConfig.findOne({ tenantId });

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Tenant configuration not found'
      });
    }

    res.json({
      success: true,
      data: { config }
    });
  } catch (error) {
    console.error('[TenantController] getTenantConfig error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tenant configuration',
      message: error.message
    });
  }
};

/**
 * Update tenant configuration
 */
const updateTenantConfig = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const updates = req.body;

    // Protected fields
    delete updates._id;
    delete updates.tenantId;
    delete updates.tenantCode;

    const config = await TenantConfig.findOne({ tenantId });

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Tenant configuration not found'
      });
    }

    const beforeData = config.toObject();

    // Deep merge updates
    Object.keys(updates).forEach(key => {
      if (typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
        config[key] = { ...config[key]?.toObject?.() || config[key], ...updates[key] };
      } else {
        config[key] = updates[key];
      }
    });

    config.lastModifiedBy = req.superAdmin.id;
    config.version += 1;

    await config.save();

    // Clear cache
    const { clearTenantCache } = require('../middleware/tenant.middleware');
    clearTenantCache(config.tenantCode);

    await TenantAuditLog.log({
      tenantId,
      tenantCode: config.tenantCode,
      action: 'TENANT_CONFIG_UPDATED',
      actorType: 'super_admin',
      actorId: req.superAdmin.id,
      actorEmail: req.superAdmin.email,
      actorRole: req.superAdmin.role,
      ip: req.ip,
      changes: {
        before: beforeData,
        after: config.toObject(),
        fields: Object.keys(updates)
      }
    });

    res.json({
      success: true,
      message: 'Tenant configuration updated successfully',
      data: { config }
    });
  } catch (error) {
    console.error('[TenantController] updateTenantConfig error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update tenant configuration',
      message: error.message
    });
  }
};

/**
 * Update feature flags
 */
const updateFeatureFlags = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { features, killSwitches, rollout } = req.body;

    const config = await TenantConfig.findOne({ tenantId });

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Tenant configuration not found'
      });
    }

    const beforeData = {
      features: config.features?.toObject?.() || config.features,
      killSwitches: config.killSwitches?.toObject?.() || config.killSwitches,
      rollout: config.rollout?.toObject?.() || config.rollout
    };

    if (features) {
      config.features = { ...config.features.toObject?.() || config.features, ...features };
    }
    if (killSwitches) {
      config.killSwitches = { ...config.killSwitches.toObject?.() || config.killSwitches, ...killSwitches };
    }
    if (rollout) {
      config.rollout = { ...config.rollout.toObject?.() || config.rollout, ...rollout };
    }

    config.lastModifiedBy = req.superAdmin.id;
    config.version += 1;

    await config.save();

    // Clear cache
    const { clearTenantCache } = require('../middleware/tenant.middleware');
    clearTenantCache(config.tenantCode);

    // Determine action based on changes
    let action = 'FEATURE_FLAG_CHANGED';
    if (killSwitches && Object.values(killSwitches).some(v => v === true)) {
      action = 'KILL_SWITCH_ACTIVATED';
    } else if (killSwitches && Object.values(killSwitches).some(v => v === false)) {
      action = 'KILL_SWITCH_DEACTIVATED';
    }

    await TenantAuditLog.log({
      tenantId,
      tenantCode: config.tenantCode,
      action,
      actorType: 'super_admin',
      actorId: req.superAdmin.id,
      actorEmail: req.superAdmin.email,
      actorRole: req.superAdmin.role,
      ip: req.ip,
      changes: {
        before: beforeData,
        after: {
          features: config.features,
          killSwitches: config.killSwitches,
          rollout: config.rollout
        }
      },
      severity: action.includes('KILL_SWITCH') ? 'warning' : 'info'
    });

    res.json({
      success: true,
      message: 'Feature flags updated successfully',
      data: {
        features: config.features,
        killSwitches: config.killSwitches,
        rollout: config.rollout
      }
    });
  } catch (error) {
    console.error('[TenantController] updateFeatureFlags error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update feature flags',
      message: error.message
    });
  }
};

/**
 * Update branding
 */
const updateBranding = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { branding } = req.body;

    if (!branding) {
      return res.status(400).json({
        success: false,
        error: 'Branding data is required'
      });
    }

    const config = await TenantConfig.findOne({ tenantId });

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Tenant configuration not found'
      });
    }

    config.branding = { ...config.branding.toObject?.() || config.branding, ...branding };
    config.lastModifiedBy = req.superAdmin.id;
    config.version += 1;

    await config.save();

    // Clear cache
    const { clearTenantCache } = require('../middleware/tenant.middleware');
    clearTenantCache(config.tenantCode);

    res.json({
      success: true,
      message: 'Branding updated successfully',
      data: { branding: config.branding }
    });
  } catch (error) {
    console.error('[TenantController] updateBranding error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update branding',
      message: error.message
    });
  }
};

/**
 * Get tenant statistics
 */
const getTenantStats = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    const { Complaint, Announcement, GramSabhaMeeting, Poll } = require('../models');

    const [
      userCount,
      complaintStats,
      announcementCount,
      meetingCount,
      pollCount
    ] = await Promise.all([
      User.countDocuments({ panchayatCode: tenant.tenantCode }),
      Complaint.aggregate([
        { $match: { tenantId: tenant._id } },
        { $group: {
          _id: '$status',
          count: { $sum: 1 }
        }}
      ]),
      Announcement.countDocuments({ tenantId: tenant._id }),
      GramSabhaMeeting.countDocuments({ tenantId: tenant._id }),
      Poll.countDocuments({ tenantId: tenant._id })
    ]);

    const complaintsByStatus = complaintStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        users: {
          total: userCount,
          max: tenant.subscription.maxUsers,
          usage: Math.round((userCount / tenant.subscription.maxUsers) * 100)
        },
        complaints: {
          total: Object.values(complaintsByStatus).reduce((a, b) => a + b, 0),
          byStatus: complaintsByStatus,
          max: tenant.subscription.maxComplaints
        },
        announcements: announcementCount,
        meetings: meetingCount,
        polls: pollCount
      }
    });
  } catch (error) {
    console.error('[TenantController] getTenantStats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tenant statistics',
      message: error.message
    });
  }
};

/**
 * Get tenant billing history
 */
const getTenantBilling = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { months = 12 } = req.query;

    const billing = await TenantBilling.getTenantHistory(tenantId, parseInt(months));

    res.json({
      success: true,
      data: { billing }
    });
  } catch (error) {
    console.error('[TenantController] getTenantBilling error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch billing history',
      message: error.message
    });
  }
};

module.exports = {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  activateTenant,
  suspendTenant,
  archiveTenant,
  getTenantConfig,
  updateTenantConfig,
  updateFeatureFlags,
  updateBranding,
  getTenantStats,
  getTenantBilling
};

