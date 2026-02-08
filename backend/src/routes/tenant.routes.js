const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenant.controller');
const {
  verifySuperAdmin,
  requirePermission,
  requireTenantAccess,
  logSuperAdminAction,
  enforceReadOnly
} = require('../middleware/super-admin.middleware');

/**
 * Phase 4: Tenant Routes
 * All routes require super admin authentication
 */

// Apply super admin authentication to all routes
router.use(verifySuperAdmin);
router.use(enforceReadOnly);

// ============ TENANT CRUD ============

// List all tenants
router.get('/', tenantController.getAllTenants);

// Get single tenant
router.get('/:tenantId', requireTenantAccess, tenantController.getTenantById);

// Create tenant
router.post('/',
  requirePermission('canCreateTenant'),
  logSuperAdminAction('TENANT_CREATED'),
  tenantController.createTenant
);

// Update tenant
router.put('/:tenantId',
  requireTenantAccess,
  requirePermission('canModifyTenantConfig'),
  logSuperAdminAction('TENANT_CONFIG_UPDATED'),
  tenantController.updateTenant
);

// ============ TENANT LIFECYCLE ============

// Activate tenant
router.post('/:tenantId/activate',
  requireTenantAccess,
  requirePermission('canCreateTenant'),
  logSuperAdminAction('TENANT_ACTIVATED'),
  tenantController.activateTenant
);

// Suspend tenant
router.post('/:tenantId/suspend',
  requireTenantAccess,
  requirePermission('canSuspendTenant'),
  logSuperAdminAction('TENANT_SUSPENDED', () => 'warning'),
  tenantController.suspendTenant
);

// Archive tenant
router.post('/:tenantId/archive',
  requireTenantAccess,
  requirePermission('canArchiveTenant'),
  logSuperAdminAction('TENANT_ARCHIVED', () => 'critical'),
  tenantController.archiveTenant
);

// ============ TENANT CONFIGURATION ============

// Get tenant config
router.get('/:tenantId/config', requireTenantAccess, tenantController.getTenantConfig);

// Update tenant config
router.put('/:tenantId/config',
  requireTenantAccess,
  requirePermission('canModifyTenantConfig'),
  logSuperAdminAction('TENANT_CONFIG_UPDATED'),
  tenantController.updateTenantConfig
);

// Update feature flags
router.put('/:tenantId/features',
  requireTenantAccess,
  requirePermission('canModifyTenantConfig'),
  logSuperAdminAction('FEATURE_FLAG_CHANGED'),
  tenantController.updateFeatureFlags
);

// Update branding
router.put('/:tenantId/branding',
  requireTenantAccess,
  requirePermission('canModifyTenantConfig'),
  tenantController.updateBranding
);

// ============ TENANT ANALYTICS ============

// Get tenant statistics
router.get('/:tenantId/stats', requireTenantAccess, tenantController.getTenantStats);

// Get tenant billing
router.get('/:tenantId/billing', requireTenantAccess, tenantController.getTenantBilling);

module.exports = router;
