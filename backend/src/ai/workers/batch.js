/**
 * Batch Processing Pipelines
 *
 * Phase 3 Feature 3: Scheduled batch jobs for maintenance
 *
 * Daily Jobs (02:00):
 * - Trend baselines calculation
 * - Sentiment aggregation
 * - Cache cleanup
 * - Index refresh
 *
 * Weekly Jobs (Sunday 02:00):
 * - Archive old data
 * - Rebuild embeddings
 * - Accuracy evaluation
 *
 * All jobs are:
 * - Pausable
 * - Resumable
 * - Idempotent
 * - Logged
 */

const { getQueue, PRIORITY } = require('./queue');

// Job registry
const jobHandlers = new Map();

// Batch job configuration
const BATCH_CONFIG = {
  daily: {
    schedule: '0 2 * * *',  // 02:00 daily
    jobs: ['trend-baseline', 'sentiment-aggregation', 'cache-cleanup', 'index-refresh']
  },
  weekly: {
    schedule: '0 2 * * 0',  // 02:00 Sunday
    jobs: ['archive-old-data', 'rebuild-embeddings', 'accuracy-evaluation']
  }
};

// Job execution state
const jobState = {
  lastDaily: null,
  lastWeekly: null,
  isPaused: false,
  runningJobs: new Set()
};

/**
 * Register all batch job handlers
 */
const registerBatchHandlers = () => {
  const dailyQueue = getQueue('daily-batch');
  const weeklyQueue = getQueue('weekly-batch');

  // ===== DAILY JOBS =====

  // Trend Baseline Calculation
  dailyQueue.register('trend-baseline', async (data, job) => {
    console.log('[Batch] Running trend baseline calculation...');
    const start = Date.now();

    try {
      const { Complaint } = require('../../models');

      // Calculate baselines for last 30 days
      const complaints = await Complaint.find({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }).select('category createdAt').lean();

      // Group by category and day
      const baselines = {};
      for (const c of complaints) {
        const day = c.createdAt.toISOString().split('T')[0];
        const key = `${c.category}:${day}`;
        baselines[key] = (baselines[key] || 0) + 1;
      }

      return {
        duration: Date.now() - start,
        complaintsAnalyzed: complaints.length,
        baselinesDays: Object.keys(baselines).length
      };
    } catch (error) {
      console.error('[Batch] Trend baseline error:', error.message);
      throw error;
    }
  });

  // Sentiment Aggregation
  dailyQueue.register('sentiment-aggregation', async (data, job) => {
    console.log('[Batch] Running sentiment aggregation...');
    const start = Date.now();

    try {
      const { Complaint } = require('../../models');

      // Get yesterday's complaints
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const complaints = await Complaint.find({
        createdAt: { $gte: yesterday, $lt: today }
      }).select('title description category priority status').lean();

      // Simple sentiment analysis based on keywords
      let positive = 0, negative = 0, neutral = 0;
      const negativeWords = ['broken', 'damaged', 'urgent', 'dangerous', 'emergency', 'critical'];
      const positiveWords = ['thank', 'resolved', 'fixed', 'improved', 'better'];

      for (const c of complaints) {
        const text = `${c.title} ${c.description}`.toLowerCase();
        const hasNegative = negativeWords.some(w => text.includes(w));
        const hasPositive = positiveWords.some(w => text.includes(w));

        if (hasNegative && !hasPositive) negative++;
        else if (hasPositive && !hasNegative) positive++;
        else neutral++;
      }

      return {
        duration: Date.now() - start,
        date: yesterday.toISOString().split('T')[0],
        total: complaints.length,
        sentiment: { positive, negative, neutral }
      };
    } catch (error) {
      console.error('[Batch] Sentiment aggregation error:', error.message);
      throw error;
    }
  });

  // Cache Cleanup
  dailyQueue.register('cache-cleanup', async (data, job) => {
    console.log('[Batch] Running cache cleanup...');
    const start = Date.now();

    try {
      const cache = require('../cache');
      const stats = await cache.getAllStats();

      // Cleanup expired items from MongoDB cache
      let cleaned = 0;
      if (cache.mongoCache) {
        const result = await cache.mongoCache.cleanup();
        cleaned = result?.deleted || 0;
      }

      return {
        duration: Date.now() - start,
        beforeStats: stats,
        itemsCleaned: cleaned
      };
    } catch (error) {
      console.error('[Batch] Cache cleanup error:', error.message);
      throw error;
    }
  });

  // Index Refresh
  dailyQueue.register('index-refresh', async (data, job) => {
    console.log('[Batch] Running index refresh...');
    const start = Date.now();

    try {
      const search = require('../search.service');

      // Rebuild search index
      const result = await search.buildIndex();

      return {
        duration: Date.now() - start,
        indexStats: result
      };
    } catch (error) {
      console.error('[Batch] Index refresh error:', error.message);
      throw error;
    }
  });

  // ===== WEEKLY JOBS =====

  // Archive Old Data
  weeklyQueue.register('archive-old-data', async (data, job) => {
    console.log('[Batch] Running data archival...');
    const start = Date.now();

    try {
      const { Complaint } = require('../../models');

      // Archive complaints older than 1 year that are resolved
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);

      const oldComplaints = await Complaint.find({
        status: 'resolved',
        createdAt: { $lt: cutoffDate }
      }).select('_id trackingId title category createdAt updatedAt').lean();

      // Mark as archived (add flag instead of deleting)
      let archived = 0;
      for (const c of oldComplaints) {
        await Complaint.updateOne(
          { _id: c._id },
          { $set: { archived: true, archivedAt: new Date() } }
        );
        archived++;
      }

      return {
        duration: Date.now() - start,
        cutoffDate: cutoffDate.toISOString(),
        complaintsArchived: archived
      };
    } catch (error) {
      console.error('[Batch] Archive error:', error.message);
      throw error;
    }
  });

  // Rebuild Embeddings (placeholder - TF-IDF indices)
  weeklyQueue.register('rebuild-embeddings', async (data, job) => {
    console.log('[Batch] Running embeddings rebuild...');
    const start = Date.now();

    try {
      const duplicate = require('../duplicate.service');
      const search = require('../search.service');

      // Rebuild duplicate detection index
      await duplicate.rebuildIndex();

      // Rebuild search index
      const searchResult = await search.buildIndex();

      return {
        duration: Date.now() - start,
        duplicateIndexRebuilt: true,
        searchIndexStats: searchResult
      };
    } catch (error) {
      console.error('[Batch] Embeddings rebuild error:', error.message);
      throw error;
    }
  });

  // Accuracy Evaluation
  weeklyQueue.register('accuracy-evaluation', async (data, job) => {
    console.log('[Batch] Running accuracy evaluation...');
    const start = Date.now();

    try {
      const classifier = require('../classifier.service');
      const { Complaint } = require('../../models');

      // Get resolved complaints from last week for evaluation
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const complaints = await Complaint.find({
        status: 'resolved',
        createdAt: { $gte: weekAgo }
      }).select('title description category').lean();

      // Evaluate classification accuracy
      let correct = 0;
      for (const c of complaints) {
        const predicted = classifier.classifyByKeywords(`${c.title} ${c.description}`);
        if (predicted.category === c.category) {
          correct++;
        }
      }

      const accuracy = complaints.length > 0
        ? ((correct / complaints.length) * 100).toFixed(2)
        : 'N/A';

      return {
        duration: Date.now() - start,
        evaluated: complaints.length,
        correct,
        accuracy: `${accuracy}%`
      };
    } catch (error) {
      console.error('[Batch] Accuracy evaluation error:', error.message);
      throw error;
    }
  });

  console.log('[Batch] All batch handlers registered');
  return { daily: dailyQueue, weekly: weeklyQueue };
};

/**
 * Run daily batch jobs
 */
const runDailyBatch = async () => {
  if (jobState.isPaused) {
    console.log('[Batch] Batch processing is paused');
    return { skipped: true, reason: 'paused' };
  }

  console.log('[Batch] Starting daily batch jobs...');
  const results = {};

  const queue = getQueue('daily-batch');

  for (const jobType of BATCH_CONFIG.daily.jobs) {
    const jobId = queue.add(jobType, { triggeredAt: new Date() }, {
      priority: PRIORITY.NORMAL,
      timeoutMs: 60000
    });
    results[jobType] = { jobId, queued: true };
  }

  jobState.lastDaily = new Date();

  return {
    triggeredAt: jobState.lastDaily,
    jobs: results,
    message: 'Daily batch jobs queued'
  };
};

/**
 * Run weekly batch jobs
 */
const runWeeklyBatch = async () => {
  if (jobState.isPaused) {
    console.log('[Batch] Batch processing is paused');
    return { skipped: true, reason: 'paused' };
  }

  console.log('[Batch] Starting weekly batch jobs...');
  const results = {};

  const queue = getQueue('weekly-batch');

  for (const jobType of BATCH_CONFIG.weekly.jobs) {
    const jobId = queue.add(jobType, { triggeredAt: new Date() }, {
      priority: PRIORITY.NORMAL,
      timeoutMs: 300000  // 5 minutes for weekly jobs
    });
    results[jobType] = { jobId, queued: true };
  }

  jobState.lastWeekly = new Date();

  return {
    triggeredAt: jobState.lastWeekly,
    jobs: results,
    message: 'Weekly batch jobs queued'
  };
};

/**
 * Pause all batch processing
 */
const pauseBatch = () => {
  jobState.isPaused = true;
  getQueue('daily-batch').pause();
  getQueue('weekly-batch').pause();
  return { paused: true };
};

/**
 * Resume batch processing
 */
const resumeBatch = () => {
  jobState.isPaused = false;
  getQueue('daily-batch').resume();
  getQueue('weekly-batch').resume();
  return { resumed: true };
};

/**
 * Get batch processing status
 */
const getBatchStatus = () => {
  return {
    isPaused: jobState.isPaused,
    lastDaily: jobState.lastDaily,
    lastWeekly: jobState.lastWeekly,
    config: BATCH_CONFIG,
    queues: {
      daily: getQueue('daily-batch').getStatus(),
      weekly: getQueue('weekly-batch').getStatus()
    }
  };
};

/**
 * Simple cron-like scheduler (runs in-process)
 */
let schedulerInterval = null;

const startScheduler = () => {
  if (schedulerInterval) return;

  console.log('[Batch] Starting batch scheduler');

  schedulerInterval = setInterval(() => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const dayOfWeek = now.getDay();

    // Daily at 02:00
    if (hour === 2 && minute === 0) {
      runDailyBatch();
    }

    // Weekly on Sunday at 02:00
    if (dayOfWeek === 0 && hour === 2 && minute === 0) {
      runWeeklyBatch();
    }
  }, 60000); // Check every minute

  return { started: true };
};

const stopScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
  return { stopped: true };
};

module.exports = {
  registerBatchHandlers,
  runDailyBatch,
  runWeeklyBatch,
  pauseBatch,
  resumeBatch,
  getBatchStatus,
  startScheduler,
  stopScheduler,
  BATCH_CONFIG
};
