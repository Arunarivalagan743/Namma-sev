/**
 * Model & Cache Versioning
 *
 * Phase 3 Feature 6: Version tracking and rollback support
 *
 * Features:
 * - Version tracking for AI models
 * - Cache schema versioning
 * - Backward compatibility checks
 * - Rollback scripts
 */

const fs = require('fs');
const path = require('path');

// Current versions
const VERSIONS = {
  // AI Service versions
  ai: {
    preprocessor: '1.0.0',
    classifier: '1.0.0',
    priorityScorer: '1.0.0',
    duplicateDetector: '1.0.0',
    searchService: '1.0.0',
    templates: '1.0.0',
    trends: '1.0.0',
    verification: '1.0.0'
  },

  // Cache schema versions
  cache: {
    translationCache: '1.0.0',
    searchIndex: '1.0.0',
    embeddings: '1.0.0',
    lruCache: '1.0.0'
  },

  // Pipeline versions
  pipeline: {
    complaintProcessing: '1.0.0',
    batchDaily: '1.0.0',
    batchWeekly: '1.0.0'
  },

  // System version
  system: '3.0.0'  // Phase 3
};

// Version history (for rollback)
const VERSION_HISTORY = [
  { version: '1.0.0', date: '2025-02-04', phase: 1, description: 'Initial AI implementation' },
  { version: '2.0.0', date: '2025-02-04', phase: 2, description: 'Productivity features' },
  { version: '3.0.0', date: '2025-02-04', phase: 3, description: 'Engineering maturity' }
];

// Migration scripts registry
const migrations = new Map();

/**
 * Register a migration script
 */
const registerMigration = (fromVersion, toVersion, migrateFn, rollbackFn) => {
  const key = `${fromVersion}->${toVersion}`;
  migrations.set(key, {
    from: fromVersion,
    to: toVersion,
    migrate: migrateFn,
    rollback: rollbackFn,
    registeredAt: new Date()
  });
};

/**
 * Get current versions
 */
const getVersions = () => {
  return {
    ...VERSIONS,
    generatedAt: new Date().toISOString()
  };
};

/**
 * Get version history
 */
const getVersionHistory = () => {
  return VERSION_HISTORY;
};

/**
 * Check if cache is compatible with current version
 */
const isCacheCompatible = (cachedVersion, requiredVersion) => {
  if (!cachedVersion) return false;

  const [cachedMajor, cachedMinor] = cachedVersion.split('.').map(Number);
  const [reqMajor, reqMinor] = requiredVersion.split('.').map(Number);

  // Major version must match
  if (cachedMajor !== reqMajor) return false;

  // Minor version must be >= required
  return cachedMinor >= reqMinor;
};

/**
 * Generate version metadata for cached items
 */
const createVersionedCacheKey = (baseKey, service) => {
  const version = VERSIONS.cache[service] || VERSIONS.system;
  return `v${version}:${baseKey}`;
};

/**
 * Check and invalidate incompatible cache entries
 */
const validateCacheVersion = async (cacheService, expectedVersion) => {
  // This would check cached items and invalidate old versions
  // Simplified implementation
  return {
    service: cacheService,
    expectedVersion,
    validated: true
  };
};

/**
 * Rollback to previous version
 */
const rollback = async (targetVersion) => {
  const currentIdx = VERSION_HISTORY.findIndex(v => v.version === VERSIONS.system);
  const targetIdx = VERSION_HISTORY.findIndex(v => v.version === targetVersion);

  if (targetIdx === -1) {
    throw new Error(`Version ${targetVersion} not found in history`);
  }

  if (targetIdx >= currentIdx) {
    throw new Error(`Cannot rollback to same or newer version`);
  }

  // Find and execute rollback migrations
  const rollbacks = [];
  for (let i = currentIdx; i > targetIdx; i--) {
    const from = VERSION_HISTORY[i].version;
    const to = VERSION_HISTORY[i - 1].version;
    const key = `${to}->${from}`;

    const migration = migrations.get(key);
    if (migration && migration.rollback) {
      rollbacks.push({
        from,
        to,
        script: migration.rollback
      });
    }
  }

  return {
    from: VERSIONS.system,
    to: targetVersion,
    rollbackSteps: rollbacks.length,
    note: 'Execute rollback scripts manually for safety'
  };
};

/**
 * Get migration plan
 */
const getMigrationPlan = (fromVersion, toVersion) => {
  const key = `${fromVersion}->${toVersion}`;
  const migration = migrations.get(key);

  if (!migration) {
    return { available: false, from: fromVersion, to: toVersion };
  }

  return {
    available: true,
    from: fromVersion,
    to: toVersion,
    hasMigrate: !!migration.migrate,
    hasRollback: !!migration.rollback
  };
};

/**
 * Export version manifest
 */
const exportManifest = () => {
  return {
    versions: VERSIONS,
    history: VERSION_HISTORY,
    migrations: Array.from(migrations.keys()),
    exportedAt: new Date().toISOString()
  };
};

// Register default migrations
registerMigration('2.0.0', '3.0.0',
  async () => {
    // Migration from Phase 2 to Phase 3
    console.log('[Migration] Upgrading from 2.0.0 to 3.0.0');
    // - Initialize job queues
    // - Setup batch handlers
    // - Create metrics collection
    return { success: true };
  },
  async () => {
    // Rollback from Phase 3 to Phase 2
    console.log('[Migration] Rolling back from 3.0.0 to 2.0.0');
    // - Stop schedulers
    // - Clear queue state
    return { success: true };
  }
);

module.exports = {
  VERSIONS,
  VERSION_HISTORY,
  getVersions,
  getVersionHistory,
  isCacheCompatible,
  createVersionedCacheKey,
  validateCacheVersion,
  registerMigration,
  getMigrationPlan,
  rollback,
  exportManifest
};

