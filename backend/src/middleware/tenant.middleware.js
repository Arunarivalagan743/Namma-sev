// filepath: /home/cykosynergy/projects/Namma-sev/backend/src/middleware/tenant.middleware.js
const { Tenant, TenantConfig, TenantAuditLog, TenantBilling } = require('../models');

/**
 * Phase 4: Multi-Tenant Middleware
 * Handles tenant resolution, isolation, and context propagation
 */

// Cache for tenant configs (5 minute TTL)
const tenantConfigCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Clear tenant config from cache
 */
const clearTenantCache = (tenantCode) => {
  tenantConfigCache.delete(tenantCode.toUpperCase());
};

/**
 * Get tenant config with caching
 */
const getTenantConfig = async (tenantCode) => {
  const code = tenantCode.toUpperCase();
  const cached = tenantConfigCache.get(code);

  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.config;
  }

  const config = await TenantConfig.findOne({ tenantCode: code });
  if (config) {
    tenantConfigCache.set(code, {
      config,
      timestamp: Date.now()
    });
  }

  return config;
};

/**
 * Resolve tenant from request
 * Priority: 1) Header 2) Domain 3) User's panchayatCode 4) Default
 */
const resolveTenant = async (req, res, next) => {
  try {
    let tenantCode = null;
    let tenant = null;
    let tenantConfig = null;

    // 1. Check X-Tenant-ID header (for API calls)
    if (req.headers['x-tenant-id']) {
      tenantCode = req.headers['x-tenant-id'].toUpperCase();
    }

    // 2. Check domain mapping
    if (!tenantCode && req.hostname) {
      tenantConfig = await TenantConfig.getByDomain(req.hostname);
      if (tenantConfig) {
        tenantCode = tenantConfig.tenantCode;
      }
    }

    // 3. Check user's panchayat code (from auth)
    if (!tenantCode && req.user && req.user.panchayat_code) {
      tenantCode = req.user.panchayat_code.toUpperCase();
    }

    // 4. Default tenant for backwards compatibility
    if (!tenantCode) {
      tenantCode = process.env.DEFAULT_TENANT_CODE || 'TIRU001';
    }

    // Fetch tenant
    tenant = await Tenant.findByCode(tenantCode);

    if (!tenant) {
      // Auto-create default tenant if it doesn't exist (for migration)
      if (tenantCode === 'TIRU001') {
        tenant = await createDefaultTenant();
      } else {
        return res.status(404).json({
          error: 'Tenant Not Found',
          message: `Tenant with code ${tenantCode} does not exist`
        });
      }
    }

    // Check tenant status
    if (tenant.status === 'suspended') {
      return res.status(403).json({
        error: 'Tenant Suspended',
        message: 'This Panchayat account has been temporarily suspended. Please contact support.'
      });
    }

    if (tenant.status === 'archived') {
      return res.status(410).json({
        error: 'Tenant Archived',
        message: 'This Panchayat account is no longer active.'
      });
    }

    if (tenant.status === 'pending') {
      return res.status(403).json({
        error: 'Tenant Pending',
        message: 'This Panchayat account is pending activation.'
      });
    }

    // Fetch tenant config if not already loaded
    if (!tenantConfig) {
      tenantConfig = await getTenantConfig(tenantCode);

      // Create default config if missing
      if (!tenantConfig) {
        tenantConfig = await TenantConfig.createDefault(tenant._id, tenantCode);
      }
    }

    // Attach tenant context to request
    req.tenant = {
      id: tenant._id,
      code: tenant.tenantCode,
      name: tenant.name,
      type: tenant.type,
      hierarchy: tenant.hierarchy,
      subscription: tenant.subscription,
      dataGovernance: tenant.dataGovernance
    };

    req.tenantConfig = tenantConfig;

    // Track API usage for billing
    trackApiUsage(req, tenant._id, tenantCode);

    next();
  } catch (error) {
    console.error('[TenantMiddleware] Error resolving tenant:', error.message);
    return res.status(500).json({
      error: 'Tenant Resolution Failed',
      message: 'Unable to determine tenant context'
    });
  }
};

/**
 * Create default tenant for migration
 */
const createDefaultTenant = async () => {
  const Tenant = require('../models/Tenant');
  const TenantConfig = require('../models/TenantConfig');

  const tenant = new Tenant({
    tenantCode: 'TIRU001',
    name: 'Tirupur Panchayat',
    type: 'panchayat',
    hierarchy: {
      state: 'Tamil Nadu',
      district: 'Tirupur',
      taluk: 'Tirupur',
      block: 'Tirupur'
    },
    status: 'active',
    activatedAt: new Date(),
    contact: {
      officialEmail: 'panchayat.office@gmail.com'
    },
    subscription: {
      plan: 'standard',
      maxUsers: 1000,
      maxComplaints: 50000,
      maxStorageMB: 5120
    }
  });

  await tenant.save();
  await TenantConfig.createDefault(tenant._id, 'TIRU001');

  console.log('[TenantMiddleware] Created default tenant: TIRU001');
  return tenant;
};

/**
 * Tenant guard - ensures user belongs to the resolved tenant
 */
const tenantGuard = async (req, res, next) => {
  try {
    // Skip guard for super admins (handled by super-admin middleware)
    if (req.superAdmin) {
      return next();
    }

    // Skip if no user context (public routes)
    if (!req.user) {
      return next();
    }

    // Ensure user's panchayat matches resolved tenant
    const userTenantCode = (req.user.panchayat_code || '').toUpperCase();
    const resolvedTenantCode = req.tenant.code;

    if (userTenantCode && userTenantCode !== resolvedTenantCode) {
      // Log cross-tenant attempt
      await TenantAuditLog.logCritical({
        tenantId: req.tenant.id,
        tenantCode: resolvedTenantCode,
        action: 'CROSS_TENANT_ATTEMPT',
        actorType: 'user',
        actorId: req.user.id,
        actorEmail: req.user.email,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          reason: `User from ${userTenantCode} attempted to access ${resolvedTenantCode}`,
          source: 'api'
        }
      });

      return res.status(403).json({
        error: 'Cross-Tenant Access Denied',
        message: 'You do not have access to this Panchayat'
      });
    }

    next();
  } catch (error) {
    console.error('[TenantGuard] Error:', error.message);
    return res.status(500).json({
      error: 'Authorization Failed',
      message: 'Unable to verify tenant access'
    });
  }
};

/**
 * Feature flag check middleware factory
 */
const requireFeature = (featureName) => {
  return (req, res, next) => {
    if (!req.tenantConfig) {
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'Tenant configuration not loaded'
      });
    }

    // Check if feature is enabled
    if (!req.tenantConfig.isFeatureEnabled(featureName)) {
      return res.status(403).json({
        error: 'Feature Disabled',
        message: `The ${featureName} feature is not enabled for your Panchayat`
      });
    }

    // Check rollout percentage
    if (req.user && !req.tenantConfig.isInRollout(featureName, req.user.id || req.user.uid)) {
      return res.status(403).json({
        error: 'Feature Not Available',
        message: `The ${featureName} feature is not yet available for your account`
      });
    }

    next();
  };
};

/**
 * Check kill switch middleware factory
 */
const checkKillSwitch = (switchName) => {
  return (req, res, next) => {
    if (req.tenantConfig && req.tenantConfig.killSwitches[switchName]) {
      return res.status(503).json({
        error: 'Service Temporarily Unavailable',
        message: `This feature is temporarily disabled. Please try again later.`
      });
    }
    next();
  };
};

/**
 * Track API usage for billing
 */
const trackApiUsage = async (req, tenantId, tenantCode) => {
  try {
    // Determine API category based on path
    let category = 'otherRequests';
    const path = req.path.toLowerCase();

    if (path.includes('/auth')) category = 'authRequests';
    else if (path.includes('/complaint')) category = 'complaintRequests';
    else if (path.includes('/announcement')) category = 'announcementRequests';
    else if (path.includes('/admin')) category = 'adminRequests';

    // Fire and forget - don't block request
    setImmediate(async () => {
      try {
        await TenantBilling.incrementUsage(tenantId, tenantCode, 'apiUsage', category);
      } catch (e) {
        // Silent fail for billing tracking
      }
    });
  } catch (error) {
    // Don't let billing tracking fail the request
  }
};

/**
 * Inject tenant filter into mongoose queries
 * Usage: Add to model methods that need tenant isolation
 */
const addTenantFilter = (query, tenantId) => {
  if (!tenantId) {
    throw new Error('Tenant ID required for data access');
  }
  return { ...query, tenantId };
};

/**
 * Middleware to inject tenant filter helper
 */
const injectTenantHelpers = (req, res, next) => {
  req.addTenantFilter = (query) => addTenantFilter(query, req.tenant?.id);

  req.getTenantId = () => req.tenant?.id;
  req.getTenantCode = () => req.tenant?.code;

  next();
};

/**
 * Validate tenant limits
 */
const checkTenantLimits = async (req, res, next) => {
  try {
    if (!req.tenant) {
      return next();
    }

    const { User, Complaint } = require('../models');

    // Get current counts
    const userCount = await User.countDocuments({ panchayatCode: req.tenant.code });
    const complaintCount = await Complaint.countDocuments({ tenantId: req.tenant.id });

    // Check limits
    const { maxUsers, maxComplaints } = req.tenant.subscription;

    // Store limit status in request
    req.tenantLimits = {
      users: { current: userCount, max: maxUsers, exceeded: userCount >= maxUsers },
      complaints: { current: complaintCount, max: maxComplaints, exceeded: complaintCount >= maxComplaints }
    };

    next();
  } catch (error) {
    console.error('[TenantLimits] Error checking limits:', error.message);
    next(); // Don't block on limit check failure
  }
};

/**
 * Require within user limit
 */
const requireUserLimit = (req, res, next) => {
  if (req.tenantLimits?.users?.exceeded) {
    return res.status(403).json({
      error: 'Limit Exceeded',
      message: 'Maximum number of users reached for this Panchayat. Please contact support to upgrade.'
    });
  }
  next();
};

/**
 * Require within complaint limit
 */
const requireComplaintLimit = (req, res, next) => {
  if (req.tenantLimits?.complaints?.exceeded) {
    return res.status(403).json({
      error: 'Limit Exceeded',
      message: 'Maximum number of complaints reached for this Panchayat. Please contact support to upgrade.'
    });
  }
  next();
};

module.exports = {
  resolveTenant,
  tenantGuard,
  requireFeature,
  checkKillSwitch,
  injectTenantHelpers,
  checkTenantLimits,
  requireUserLimit,
  requireComplaintLimit,
  addTenantFilter,
  clearTenantCache,
  getTenantConfig
};

