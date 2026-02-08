/**
 * NamSev AI Services - Main Entry Point
 *
 * Architecture:
 * - All AI processing follows the pipeline: Sanitize → Preprocess → Cache Check → Inference → Cache Store → Response
 * - Local-first processing (no external APIs for core features)
 * - Two-layer caching (L1: LRU, L2: MongoDB)
 * - Graceful degradation (app works without AI)
 *
 * Phase 1 Services:
 * - Translation caching
 * - Priority scoring
 * - Complaint classification
 * - Duplicate detection
 * - Shared preprocessor
 *
 * Phase 2 Services:
 * - Semantic search
 * - Admin response templates
 * - Trend detection
 * - User verification scoring
 *
 * Phase 4 Services:
 * - Context enrichment
 * - Enhanced semantic duplicate detection
 * - Automated complaint summarization
 *
 * Phase 5 Services:
 * - AI quality evaluation
 * - User/Admin feedback
 * - AI health dashboard
 * - Demo & test mode
 * - Drift detection
 */

// Phase 1: Core services
const preprocessor = require('./preprocessor');
const priorityService = require('./priority.service');
const classifierService = require('./classifier.service');
const duplicateService = require('./duplicate.service');
const translationCache = require('./translation.cache');

// Phase 2: Productivity services (loaded gracefully)
let searchService = null;
let templatesService = null;
let trendsService = null;
let verificationService = null;

try {
  searchService = require('./search.service');
} catch (e) { console.warn('Search service not loaded:', e.message); }

try {
  templatesService = require('./templates.service');
} catch (e) { console.warn('Templates service not loaded:', e.message); }

try {
  trendsService = require('./trends.service');
} catch (e) { console.warn('Trends service not loaded:', e.message); }

try {
  verificationService = require('./verification.service');
} catch (e) { console.warn('Verification service not loaded:', e.message); }

// Phase 4: Advanced AI services (loaded gracefully)
let enrichmentService = null;
let semanticDuplicateService = null;
let summarizationService = null;

try {
  enrichmentService = require('./enrichment.service');
  console.log('✅ Phase 4: Enrichment service loaded');
} catch (e) { console.warn('Enrichment service not loaded:', e.message); }

try {
  semanticDuplicateService = require('./semantic-duplicate.service');
  console.log('✅ Phase 4: Semantic duplicate service loaded');
} catch (e) { console.warn('Semantic duplicate service not loaded:', e.message); }

try {
  summarizationService = require('./summarization.service');
  console.log('✅ Phase 4: Summarization service loaded');
} catch (e) { console.warn('Summarization service not loaded:', e.message); }

// Phase 5: Validation & Monitoring services (loaded gracefully)
let evaluationService = null;
let feedbackService = null;
let dashboardService = null;
let demoService = null;
let driftService = null;

try {
  evaluationService = require('./evaluation.service');
  console.log('✅ Phase 5: Evaluation service loaded');
} catch (e) { console.warn('Evaluation service not loaded:', e.message); }

try {
  feedbackService = require('./feedback.service');
  console.log('✅ Phase 5: Feedback service loaded');
} catch (e) { console.warn('Feedback service not loaded:', e.message); }

try {
  dashboardService = require('./dashboard.service');
  console.log('✅ Phase 5: Dashboard service loaded');
} catch (e) { console.warn('Dashboard service not loaded:', e.message); }

try {
  demoService = require('./demo.service');
  console.log('✅ Phase 5: Demo service loaded');
} catch (e) { console.warn('Demo service not loaded:', e.message); }

try {
  driftService = require('./drift.service');
  console.log('✅ Phase 5: Drift service loaded');
} catch (e) { console.warn('Drift service not loaded:', e.message); }

// Cache layer
const cache = require('./cache');

// Service availability flags
const services = {
  // Phase 1
  preprocessor: true,
  priorityService: true,
  classifierService: true,
  duplicateService: true,
  translationCache: true,
  // Phase 2
  searchService: !!searchService,
  templatesService: !!templatesService,
  trendsService: !!trendsService,
  verificationService: !!verificationService,
  // Phase 4
  enrichmentService: !!enrichmentService,
  semanticDuplicateService: !!semanticDuplicateService,
  summarizationService: !!summarizationService,
  // Phase 5
  evaluationService: !!evaluationService,
  feedbackService: !!feedbackService,
  dashboardService: !!dashboardService,
  demoService: !!demoService,
  driftService: !!driftService
};

/**
 * Process a new complaint through the AI pipeline
 *
 * Pipeline:
 * 1. Sanitize input
 * 2. Preprocess text
 * 3. Score priority (rule-based, <1ms)
 * 4. Find duplicates (TF-IDF, <50ms)
 * 5. Classify category (keyword-based, <2ms)
 * 6. Enrich context (Phase 4, <50ms)
 * 7. Semantic duplicate detection (Phase 4, <40ms)
 *
 * @param {Object} complaint - Complaint data
 * @returns {Object} AI processing results
 */
const processComplaint = async (complaint) => {
  const startTime = Date.now();
  const { title = '', description = '', category, userId } = complaint;

  const results = {
    processed: true,
    latencyMs: 0,
    priority: null,
    duplicates: [],
    suggestedCategory: null,
    // Phase 4 additions
    enrichment: null,
    semanticDuplicates: null,
    errors: []
  };

  try {
    // Step 1: Preprocess text
    const text = `${title} ${description}`.trim();
    const processedText = preprocessor.preprocess(text, { removeStops: false });

    // Step 2: Score priority (always runs, <1ms)
    try {
      results.priority = priorityService.scorePriority(title, description, category);
    } catch (err) {
      results.errors.push({ service: 'priority', error: err.message });
    }

    // Step 3: Find duplicates (async, can fail gracefully)
    try {
      results.duplicates = await duplicateService.findSimilar(processedText, userId, {
        category,
        maxResults: 3
      });
    } catch (err) {
      results.errors.push({ service: 'duplicate', error: err.message });
      results.duplicates = [];
    }

    // Step 4: Suggest category if not provided
    if (!category) {
      try {
        const classification = await classifierService.classify(processedText);
        results.suggestedCategory = classification;
      } catch (err) {
        results.errors.push({ service: 'classifier', error: err.message });
      }
    }

    // Step 5: Context enrichment (Phase 4)
    if (enrichmentService) {
      try {
        results.enrichment = await enrichmentService.enrichComplaint({
          title,
          description,
          category: category || results.suggestedCategory?.category
        });
      } catch (err) {
        results.errors.push({ service: 'enrichment', error: err.message });
      }
    }

    // Step 6: Enhanced semantic duplicate detection (Phase 4)
    if (semanticDuplicateService) {
      try {
        results.semanticDuplicates = await semanticDuplicateService.findSemanticDuplicates(
          text,
          userId,
          { category, maxResults: 3 }
        );
      } catch (err) {
        results.errors.push({ service: 'semanticDuplicate', error: err.message });
      }
    }

  } catch (error) {
    results.processed = false;
    results.errors.push({ service: 'pipeline', error: error.message });
  }

  results.latencyMs = Date.now() - startTime;
  return results;
};

/**
 * Get AI system health status
 */
const getHealthStatus = async () => {
  const status = {
    healthy: true,
    services: {},
    cache: null
  };

  // Check each service
  for (const [name, available] of Object.entries(services)) {
    status.services[name] = {
      available,

      status: available ? 'operational' : 'unavailable'
    };
  }

  // Check cache
  try {
    status.cache = await cache.getAllStats();
  } catch (err) {
    status.cache = { error: err.message };
    status.healthy = false;
  }

  return status;
};

/**
 * Get AI metrics for monitoring
 */
const getMetrics = async () => {
  return {
    cache: await cache.getAllStats(),
    timestamp: new Date().toISOString()
  };
};

// Export all services
module.exports = {
  // Individual services
  preprocessor,
  priorityService,
  classifierService,
  duplicateService,
  translationCache,

  // Phase 2: Productivity services
  searchService,
  templatesService,
  trendsService,
  verificationService,

  // Phase 4: Advanced AI services
  enrichmentService,
  semanticDuplicateService,
  summarizationService,

  // Phase 5: Validation & Monitoring services
  evaluationService,
  feedbackService,
  dashboardService,
  demoService,
  driftService,

  // Cache layer
  cache,

  // Pipeline functions
  processComplaint,

  // Monitoring
  getHealthStatus,
  getMetrics,

  // Service flags
  services
};
