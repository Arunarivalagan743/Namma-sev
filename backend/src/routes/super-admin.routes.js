// filepath: /home/cykosynergy/projects/Namma-sev/backend/src/routes/super-admin.routes.js
const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/super-admin.controller');
const {
  verifySuperAdmin,
  requirePermission,
  logSuperAdminAction,
  requireEmergencyOverride,
  enforceReadOnly
} = require('../middleware/super-admin.middleware');

/**
 * Phase 4: Super Admin Routes
 * Platform-level administration endpoints
 */

// Apply super admin authentication to all routes
router.use(verifySuperAdmin);
router.use(enforceReadOnly);

// ============ SUPER ADMIN MANAGEMENT ============

// List all super admins (platform owner only)
router.get('/admins',
  requirePermission('canModifyGlobalConfig'),
  superAdminController.getAllSuperAdmins
);

// Create super admin (platform owner only)
router.post('/admins',
  requirePermission('canModifyGlobalConfig'),
  logSuperAdminAction('SUPER_ADMIN_ACCESS'),
  superAdminController.createSuperAdmin
);

// Update super admin (platform owner only)
router.put('/admins/:adminId',
  requirePermission('canModifyGlobalConfig'),
  logSuperAdminAction('SUPER_ADMIN_ACCESS'),
  superAdminController.updateSuperAdmin
);

// Deactivate super admin (platform owner only)
router.post('/admins/:adminId/deactivate',
  requirePermission('canModifyGlobalConfig'),
  logSuperAdminAction('SUPER_ADMIN_ACCESS', () => 'warning'),
  superAdminController.deactivateSuperAdmin
);

// ============ PLATFORM DASHBOARD ============

// Get platform overview
router.get('/dashboard', superAdminController.getPlatformDashboard);

// Get platform metrics
router.get('/metrics', superAdminController.getPlatformMetrics);

// ============ AUDIT & COMPLIANCE ============

// Get audit logs
router.get('/audit-logs', superAdminController.getAuditLogs);

// Get security events
router.get('/security-events', superAdminController.getSecurityEvents);

// ============ BILLING ============

// Get platform billing summary
router.get('/billing/summary',
  requirePermission('canAccessSystemMetrics'),
  superAdminController.getPlatformBillingSummary
);

// ============ EMERGENCY OPERATIONS ============

// Emergency suspend tenant
router.post('/emergency/suspend/:tenantId',
  requireEmergencyOverride,
  logSuperAdminAction('EMERGENCY_OVERRIDE', () => 'critical'),
  superAdminController.emergencySuspendTenant
);

// Global kill switch
router.post('/emergency/kill-switch',
  requireEmergencyOverride,
  logSuperAdminAction('KILL_SWITCH_ACTIVATED', () => 'critical'),
  superAdminController.globalKillSwitch
);

module.exports = router;

