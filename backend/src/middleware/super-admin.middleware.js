// filepath: /home/cykosynergy/projects/Namma-sev/backend/src/middleware/super-admin.middleware.js
const { admin } = require('../config/firebase');
const { SuperAdmin, TenantAuditLog, Tenant } = require('../models');

/**
 * Phase 4: Super Admin Middleware
 * Handles platform-level administrator authentication and authorization
 */

/**
 * Verify Super Admin token and permissions
 */
const verifySuperAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Super admin authentication required'
      });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }

    // Find super admin by Firebase UID
    const superAdmin = await SuperAdmin.findByFirebaseUid(decodedToken.uid);

    if (!superAdmin) {
      // Log unauthorized access attempt
      await TenantAuditLog.logWarning({
        action: 'SUPER_ADMIN_ACCESS',
        actorType: 'user',
        actorEmail: decodedToken.email,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          reason: 'Non-super-admin attempted super admin access',
          success: false
        },
        severity: 'warning'
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Super admin access required'
      });
    }

    // Check if account is locked
    if (!superAdmin.isActive()) {
      return res.status(403).json({
        error: 'Account Locked',
        message: 'Your super admin account is locked or inactive'
      });
    }

    // Attach super admin to request
    req.superAdmin = {
      id: superAdmin._id,
      firebaseUid: superAdmin.firebaseUid,
      email: superAdmin.email,
      name: superAdmin.name,
      role: superAdmin.role,
      permissions: superAdmin.permissions,
      regionAccess: superAdmin.regionAccess,
      tenantAccess: superAdmin.tenantAccess,
      specificTenants: superAdmin.specificTenants
    };

    // Update last login
    await superAdmin.recordLogin(req.ip);

    next();
  } catch (error) {
    console.error('[SuperAdminMiddleware] Error:', error.message);
    return res.status(500).json({
      error: 'Authentication Failed',
      message: 'Unable to verify super admin credentials'
    });
  }
};

/**
 * Check specific permission
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    if (!req.superAdmin) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Super admin authentication required'
      });
    }

    // Platform owner has all permissions
    if (req.superAdmin.role === 'platform_owner') {
      return next();
    }

    // Check specific permission
    if (!req.superAdmin.permissions[permission]) {
      await TenantAuditLog.logWarning({
        action: 'SUPER_ADMIN_ACCESS',
        actorType: 'super_admin',
        actorId: req.superAdmin.id,
        actorEmail: req.superAdmin.email,
        actorRole: req.superAdmin.role,
        ip: req.ip,
        metadata: {
          reason: `Permission denied: ${permission}`,
          success: false
        }
      });

      return res.status(403).json({
        error: 'Permission Denied',
        message: `You do not have permission to perform this action (requires: ${permission})`
      });
    }

    next();
  };
};

/**
 * Check tenant access for super admin
 */
const requireTenantAccess = async (req, res, next) => {
  try {
    if (!req.superAdmin) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Super admin authentication required'
      });
    }

    // Get tenant ID from params, body, or query
    const tenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Tenant ID is required'
      });
    }

    // Fetch tenant for hierarchy info
    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found'
      });
    }

    // Check access based on super admin permissions
    const superAdminDoc = await SuperAdmin.findById(req.superAdmin.id);

    if (!superAdminDoc.canAccessTenant(tenantId, tenant.hierarchy)) {
      await TenantAuditLog.logWarning({
        tenantId,
        tenantCode: tenant.tenantCode,
        action: 'SUPER_ADMIN_ACCESS',
        actorType: 'super_admin',
        actorId: req.superAdmin.id,
        actorEmail: req.superAdmin.email,
        actorRole: req.superAdmin.role,
        ip: req.ip,
        metadata: {
          reason: 'Tenant access denied by regional restrictions',
          success: false
        }
      });

      return res.status(403).json({
        error: 'Tenant Access Denied',
        message: 'You do not have access to this tenant'
      });
    }

    // Attach tenant to request
    req.targetTenant = tenant;

    next();
  } catch (error) {
    console.error('[SuperAdminMiddleware] Tenant access check failed:', error.message);
    return res.status(500).json({
      error: 'Access Check Failed',
      message: 'Unable to verify tenant access'
    });
  }
};

/**
 * Log super admin action
 */
const logSuperAdminAction = (action, getSeverity = () => 'info') => {
  return async (req, res, next) => {
    // Store original end function
    const originalEnd = res.end;

    res.end = async function(chunk, encoding) {
      // Call original end
      originalEnd.call(this, chunk, encoding);

      // Log action after response
      try {
        const success = res.statusCode < 400;
        const severity = getSeverity(req, res);

        await TenantAuditLog.log({
          tenantId: req.targetTenant?._id || req.body?.tenantId,
          tenantCode: req.targetTenant?.tenantCode || req.body?.tenantCode,
          action,
          actorType: 'super_admin',
          actorId: req.superAdmin?.id,
          actorEmail: req.superAdmin?.email,
          actorName: req.superAdmin?.name,
          actorRole: req.superAdmin?.role,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          target: {
            type: req.params.type || 'tenant',
            id: req.params.id || req.params.tenantId,
            description: req.body?.reason || req.body?.description
          },
          changes: {
            before: req.originalData,
            after: req.body,
            fields: Object.keys(req.body || {})
          },
          metadata: {
            reason: req.body?.reason,
            notes: req.body?.notes,
            requestId: req.headers['x-request-id'],
            source: 'super_admin_panel',
            success,
            errorMessage: success ? null : res.statusMessage
          },
          severity
        });
      } catch (e) {
        console.error('[SuperAdminMiddleware] Audit log failed:', e.message);
      }
    };

    next();
  };
};

/**
 * Emergency override authorization
 * Requires explicit reason and additional verification
 */
const requireEmergencyOverride = async (req, res, next) => {
  try {
    if (!req.superAdmin) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Super admin authentication required'
      });
    }

    // Check emergency override permission
    if (!req.superAdmin.permissions.canEmergencyOverride &&
        req.superAdmin.role !== 'platform_owner') {
      return res.status(403).json({
        error: 'Permission Denied',
        message: 'Emergency override permission required'
      });
    }

    // Require reason
    if (!req.body.emergencyReason) {
      return res.status(400).json({
        error: 'Reason Required',
        message: 'Emergency actions require a documented reason'
      });
    }

    // Log emergency override
    await TenantAuditLog.logCritical({
      tenantId: req.params.tenantId || req.body.tenantId,
      action: 'EMERGENCY_OVERRIDE',
      actorType: 'super_admin',
      actorId: req.superAdmin.id,
      actorEmail: req.superAdmin.email,
      actorRole: req.superAdmin.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        reason: req.body.emergencyReason,
        source: 'super_admin_panel'
      },
      compliance: {
        retentionCategory: 'permanent' // Never delete emergency override logs
      }
    });

    next();
  } catch (error) {
    console.error('[SuperAdminMiddleware] Emergency override check failed:', error.message);
    return res.status(500).json({
      error: 'Override Check Failed',
      message: 'Unable to process emergency override'
    });
  }
};

/**
 * Read-only enforcement for auditor role
 */
const enforceReadOnly = (req, res, next) => {
  if (!req.superAdmin) {
    return next();
  }

  // Auditors are read-only
  if (req.superAdmin.role === 'auditor') {
    const method = req.method.toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return res.status(403).json({
        error: 'Read-Only Access',
        message: 'Auditor accounts have read-only access'
      });
    }
  }

  next();
};

module.exports = {
  verifySuperAdmin,
  requirePermission,
  requireTenantAccess,
  logSuperAdminAction,
  requireEmergencyOverride,
  enforceReadOnly
};

