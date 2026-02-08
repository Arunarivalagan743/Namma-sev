/**
 * Warm-up & Cold Start Optimization
 *
 * Phase 3 Feature 5: Fast startup and service priming
 *
 * Targets:
 * - Cold start < 1.5s
 * - Critical routes primed
 * - Caches pre-populated
 * - Models preloaded
 */

/**
 * Warm-up tasks to run at startup
 */
const warmupTasks = [
  {
    name: 'ai-services',
    priority: 1,
    run: async () => {
      // Pre-load all AI services
      const ai = require('../index');
      return { services: Object.keys(ai.services).length };
    }
  },
  {
    name: 'preprocessor',
    priority: 1,
    run: async () => {
      // Prime the preprocessor with sample text
      const preprocessor = require('../preprocessor');
      preprocessor.preprocess('Sample text for warmup தமிழ் हिंदी');
      preprocessor.tokenize('Road water electricity sanitation');
      return { primed: true };
    }
  },
  {
    name: 'classifier',
    priority: 2,
    run: async () => {
      // Run a sample classification to warm up
      const classifier = require('../classifier.service');
      classifier.classifyByKeywords('Road pothole repair needed');
      return { primed: true };
    }
  },
  {
    name: 'priority-scorer',
    priority: 2,
    run: async () => {
      // Run a sample priority scoring
      const priority = require('../priority.service');
      priority.scorePriority('Test', 'Test description', 'Water Supply');
      return { primed: true };
    }
  },
  {
    name: 'search-index',
    priority: 3,
    run: async () => {
      // Build search index (async, doesn't block startup)
      try {
        const search = require('../search.service');
        // Don't await - let it build in background
        search.buildIndex().catch(() => {});
        return { initiated: true };
      } catch {
        return { initiated: false };
      }
    }
  },
  {
    name: 'queue-system',
    priority: 2,
    run: async () => {
      // Initialize job queues
      const { createDefaultQueues } = require('./queue');
      const queues = createDefaultQueues();
      return { queues: Object.keys(queues).length };
    }
  },
  {
    name: 'batch-handlers',
    priority: 3,
    run: async () => {
      // Register batch job handlers
      const { registerBatchHandlers } = require('./batch');
      registerBatchHandlers();
      return { registered: true };
    }
  }
];

// Warmup state
let warmupComplete = false;
let warmupResults = {};
let warmupDuration = 0;

/**
 * Run all warmup tasks
 */
const runWarmup = async () => {
  const startTime = Date.now();
  console.log('[Warmup] Starting system warm-up...');

  // Sort by priority
  const sorted = [...warmupTasks].sort((a, b) => a.priority - b.priority);

  // Run tasks
  for (const task of sorted) {
    const taskStart = Date.now();
    try {
      warmupResults[task.name] = {
        status: 'running',
        startedAt: new Date()
      };

      const result = await task.run();

      warmupResults[task.name] = {
        status: 'completed',
        duration: Date.now() - taskStart,
        result
      };
      console.log(`[Warmup] ✓ ${task.name} (${Date.now() - taskStart}ms)`);

    } catch (error) {
      warmupResults[task.name] = {
        status: 'failed',
        duration: Date.now() - taskStart,
        error: error.message
      };
      console.error(`[Warmup] ✗ ${task.name}: ${error.message}`);
    }
  }

  warmupDuration = Date.now() - startTime;
  warmupComplete = true;

  console.log(`[Warmup] Complete in ${warmupDuration}ms`);

  return {
    success: true,
    duration: warmupDuration,
    tasks: warmupResults
  };
};

/**
 * Get warmup status
 */
const getWarmupStatus = () => {
  return {
    complete: warmupComplete,
    duration: warmupDuration,
    tasks: warmupResults
  };
};

/**
 * Check if warmup is complete
 */
const isWarmedUp = () => warmupComplete;

/**
 * Lazy loader for non-critical services
 */
const lazyLoaders = {};

const lazyLoad = (serviceName, loader) => {
  if (!lazyLoaders[serviceName]) {
    lazyLoaders[serviceName] = {
      loaded: false,
      instance: null,
      loader
    };
  }

  return () => {
    const entry = lazyLoaders[serviceName];
    if (!entry.loaded) {
      entry.instance = entry.loader();
      entry.loaded = true;
    }
    return entry.instance;
  };
};

/**
 * Pre-warm translation cache with common phrases
 */
const COMMON_UI_PHRASES = [
  'Submit Complaint',
  'Track Status',
  'My Complaints',
  'Pending',
  'In Progress',
  'Resolved',
  'Rejected',
  'Water Supply',
  'Road & Infrastructure',
  'Electricity',
  'Street Lights',
  'Sanitation',
  'Drainage',
  'Public Health'
];

const warmTranslationCache = async (targetLang) => {
  // This would pre-translate common phrases
  // Simplified - actual implementation would call translation service
  console.log(`[Warmup] Pre-warming ${COMMON_UI_PHRASES.length} phrases for ${targetLang}`);
  return { phrases: COMMON_UI_PHRASES.length, language: targetLang };
};

module.exports = {
  runWarmup,
  getWarmupStatus,
  isWarmedUp,
  lazyLoad,
  warmTranslationCache,
  COMMON_UI_PHRASES
};

