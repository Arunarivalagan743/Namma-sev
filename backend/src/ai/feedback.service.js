/**
 * AI Feedback Service
 *
 * Phase 5 Feature 2: User and Admin feedback collection
 *
 * Capabilities:
 * - "Helpful / Not helpful" buttons
 * - Admin override logging
 * - Reason capture
 * - Silent feedback option
 * - Weekly aggregation
 */

const mongoose = require('mongoose');

// Configuration
const CONFIG = {
  feedbackTypes: ['helpful', 'not_helpful', 'neutral', 'override'],
  maxReasonLength: 500,
  aggregationWindow: 7 * 24 * 60 * 60 * 1000,  // 7 days
  silentFeedbackEnabled: true
};

// Feedback schema
const AIFeedbackSchema = new mongoose.Schema({
  _id: String,
  // What is being rated
  targetType: {
    type: String,
    required: true,
    enum: ['enrichment_suggestion', 'duplicate_warning', 'summary', 'priority_score', 'category_suggestion'],
    index: true
  },
  targetId: {
    type: String,
    required: true,
    index: true
  },
  complaintId: {
    type: String,
    index: true
  },
  // Who provided feedback
  userId: {
    type: String,
    index: true
  },
  userRole: {
    type: String,
    enum: ['citizen', 'admin', 'system'],
    default: 'citizen'
  },
  // Feedback content
  feedbackType: {
    type: String,
    required: true,
    enum: CONFIG.feedbackTypes
  },
  helpful: {
    type: Boolean,
    default: null
  },
  reason: {
    type: String,
    maxlength: CONFIG.maxReasonLength
  },
  reasonCategory: {
    type: String,
    enum: ['inaccurate', 'irrelevant', 'confusing', 'offensive', 'other', null]
  },
  // Override specific
  overrideAction: String,
  overrideValue: mongoose.Schema.Types.Mixed,
  // Metadata
  isSilent: {
    type: Boolean,
    default: false
  },
  context: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  collection: 'ai_feedback'
});

AIFeedbackSchema.index({ targetType: 1, createdAt: -1 });
AIFeedbackSchema.index({ helpful: 1, targetType: 1 });

let AIFeedback;
try {
  AIFeedback = mongoose.model('AIFeedback');
} catch {
  AIFeedback = mongoose.model('AIFeedback', AIFeedbackSchema);
}

// Feedback aggregation schema
const FeedbackAggregationSchema = new mongoose.Schema({
  _id: String,
  targetType: {
    type: String,
    required: true,
    index: true
  },
  period: String,
  periodStart: Date,
  periodEnd: Date,
  stats: {
    total: { type: Number, default: 0 },
    helpful: { type: Number, default: 0 },
    notHelpful: { type: Number, default: 0 },
    neutral: { type: Number, default: 0 },
    overrides: { type: Number, default: 0 },
    helpfulRate: { type: Number, default: null },
    withReason: { type: Number, default: 0 }
  },
  reasonBreakdown: [{
    category: String,
    count: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'ai_feedback_aggregations'
});

let FeedbackAggregation;
try {
  FeedbackAggregation = mongoose.model('FeedbackAggregation');
} catch {
  FeedbackAggregation = mongoose.model('FeedbackAggregation', FeedbackAggregationSchema);
}

/**
 * Generate unique ID
 */
const generateId = () => {
  return `fb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Submit feedback for an AI output
 */
const submitFeedback = async (data) => {
  try {
    const {
      targetType,
      targetId,
      complaintId,
      userId,
      userRole = 'citizen',
      feedbackType,
      helpful,
      reason,
      reasonCategory,
      isSilent = false,
      context
    } = data;

    // Validate
    if (!targetType || !targetId) {
      return { success: false, error: 'targetType and targetId are required' };
    }

    if (!CONFIG.feedbackTypes.includes(feedbackType)) {
      return { success: false, error: 'Invalid feedback type' };
    }

    const feedback = new AIFeedback({
      _id: generateId(),
      targetType,
      targetId,
      complaintId,
      userId,
      userRole,
      feedbackType,
      helpful: helpful ?? (feedbackType === 'helpful' ? true : feedbackType === 'not_helpful' ? false : null),
      reason: reason?.slice(0, CONFIG.maxReasonLength),
      reasonCategory,
      isSilent,
      context
    });

    await feedback.save();

    // Also log to evaluation service if available
    try {
      const evaluation = require('./evaluation.service');
      await evaluation.recordFeedback(targetId, {
        helpful: feedback.helpful,
        reason: feedback.reason,
        markIncorrect: feedbackType === 'not_helpful'
      });
    } catch (e) {
      // Evaluation service may not be loaded
    }

    return { success: true, feedbackId: feedback._id };
  } catch (error) {
    console.error('[Feedback] Submit error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Submit admin override feedback
 */
const submitOverride = async (data) => {
  try {
    const {
      targetType,
      targetId,
      complaintId,
      adminId,
      overrideAction,
      overrideValue,
      reason
    } = data;

    const feedback = new AIFeedback({
      _id: generateId(),
      targetType,
      targetId,
      complaintId,
      userId: adminId,
      userRole: 'admin',
      feedbackType: 'override',
      helpful: false,  // Override implies the AI was wrong
      reason,
      overrideAction,
      overrideValue
    });

    await feedback.save();

    // Log to evaluation service
    try {
      const evaluation = require('./evaluation.service');
      await evaluation.recordOverride(targetId, {
        reason,
        adminId
      });
    } catch (e) {
      // Evaluation service may not be loaded
    }

    return { success: true, feedbackId: feedback._id };
  } catch (error) {
    console.error('[Feedback] Override error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Submit silent feedback (implicit signals)
 */
const submitSilentFeedback = async (data) => {
  if (!CONFIG.silentFeedbackEnabled) {
    return { success: false, error: 'Silent feedback disabled' };
  }

  return submitFeedback({
    ...data,
    isSilent: true
  });
};

/**
 * Get feedback for a specific target
 */
const getFeedbackForTarget = async (targetType, targetId) => {
  try {
    const feedback = await AIFeedback.find({ targetType, targetId })
      .sort({ createdAt: -1 })
      .lean();

    return feedback;
  } catch (error) {
    console.error('[Feedback] Get for target error:', error.message);
    return [];
  }
};

/**
 * Aggregate feedback for a time period
 */
const aggregateFeedback = async (targetType, startDate, endDate) => {
  try {
    const feedback = await AIFeedback.find({
      targetType,
      createdAt: { $gte: startDate, $lt: endDate }
    }).lean();

    const stats = {
      total: feedback.length,
      helpful: feedback.filter(f => f.helpful === true).length,
      notHelpful: feedback.filter(f => f.helpful === false).length,
      neutral: feedback.filter(f => f.helpful === null).length,
      overrides: feedback.filter(f => f.feedbackType === 'override').length,
      withReason: feedback.filter(f => f.reason).length
    };

    stats.helpfulRate = stats.total > 0
      ? Math.round((stats.helpful / (stats.helpful + stats.notHelpful || 1)) * 1000) / 1000
      : null;

    // Reason breakdown
    const reasonCounts = {};
    feedback.forEach(f => {
      if (f.reasonCategory) {
        reasonCounts[f.reasonCategory] = (reasonCounts[f.reasonCategory] || 0) + 1;
      }
    });

    const reasonBreakdown = Object.entries(reasonCounts).map(([category, count]) => ({
      category,
      count
    }));

    return {
      targetType,
      period: { start: startDate, end: endDate },
      stats,
      reasonBreakdown
    };
  } catch (error) {
    console.error('[Feedback] Aggregate error:', error.message);
    return { error: error.message };
  }
};

/**
 * Store aggregated feedback
 */
const storeAggregation = async (targetType, period, startDate, endDate, aggregation) => {
  try {
    const id = `${targetType}-${period}-${startDate.toISOString().split('T')[0]}`;

    await FeedbackAggregation.findOneAndUpdate(
      { _id: id },
      {
        targetType,
        period,
        periodStart: startDate,
        periodEnd: endDate,
        stats: aggregation.stats,
        reasonBreakdown: aggregation.reasonBreakdown
      },
      { upsert: true, new: true }
    );

    return { success: true, id };
  } catch (error) {
    console.error('[Feedback] Store aggregation error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Run weekly aggregation job
 */
const runWeeklyAggregation = async () => {
  const targetTypes = ['enrichment_suggestion', 'duplicate_warning', 'summary', 'priority_score', 'category_suggestion'];
  const results = [];

  const endDate = new Date();
  const startDate = new Date(Date.now() - CONFIG.aggregationWindow);

  for (const targetType of targetTypes) {
    const aggregation = await aggregateFeedback(targetType, startDate, endDate);
    if (!aggregation.error) {
      await storeAggregation(targetType, 'weekly', startDate, endDate, aggregation);
    }
    results.push({ targetType, ...aggregation });
  }

  return results;
};

/**
 * Get feedback summary for dashboard
 */
const getFeedbackSummary = async () => {
  const targetTypes = ['enrichment_suggestion', 'duplicate_warning', 'summary', 'priority_score', 'category_suggestion'];
  const summary = {};

  const endDate = new Date();
  const startDate = new Date(Date.now() - CONFIG.aggregationWindow);

  for (const targetType of targetTypes) {
    summary[targetType] = await aggregateFeedback(targetType, startDate, endDate);
  }

  // Overall stats
  const totalFeedback = Object.values(summary).reduce((sum, s) => sum + (s.stats?.total || 0), 0);
  const totalHelpful = Object.values(summary).reduce((sum, s) => sum + (s.stats?.helpful || 0), 0);
  const totalNotHelpful = Object.values(summary).reduce((sum, s) => sum + (s.stats?.notHelpful || 0), 0);

  return {
    byType: summary,
    overall: {
      total: totalFeedback,
      helpful: totalHelpful,
      notHelpful: totalNotHelpful,
      helpfulRate: (totalHelpful + totalNotHelpful) > 0
        ? Math.round((totalHelpful / (totalHelpful + totalNotHelpful)) * 1000) / 1000
        : null
    },
    period: { start: startDate, end: endDate },
    timestamp: new Date().toISOString()
  };
};

/**
 * Get recent feedback for review
 */
const getRecentFeedback = async (options = {}) => {
  const {
    targetType,
    helpful,
    limit = 50,
    includeOverrides = true
  } = options;

  try {
    const query = {};
    if (targetType) query.targetType = targetType;
    if (helpful !== undefined) query.helpful = helpful;
    if (!includeOverrides) query.feedbackType = { $ne: 'override' };

    const feedback = await AIFeedback.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return feedback;
  } catch (error) {
    console.error('[Feedback] Get recent error:', error.message);
    return [];
  }
};

/**
 * Get feedback statistics
 */
const getFeedbackStats = async () => {
  const totalFeedback = await AIFeedback.countDocuments();
  const totalAggregations = await FeedbackAggregation.countDocuments();

  const typeCounts = await AIFeedback.aggregate([
    { $group: { _id: '$targetType', count: { $sum: 1 } } }
  ]);

  const helpfulCounts = await AIFeedback.aggregate([
    { $group: { _id: '$helpful', count: { $sum: 1 } } }
  ]);

  return {
    totalFeedback,
    totalAggregations,
    byType: Object.fromEntries(typeCounts.map(t => [t._id, t.count])),
    byHelpful: Object.fromEntries(helpfulCounts.map(h => [String(h._id), h.count])),
    config: CONFIG
  };
};

module.exports = {
  // Core functions
  submitFeedback,
  submitOverride,
  submitSilentFeedback,
  getFeedbackForTarget,

  // Aggregation
  aggregateFeedback,
  storeAggregation,
  runWeeklyAggregation,

  // Dashboard
  getFeedbackSummary,
  getRecentFeedback,
  getFeedbackStats,

  // Models
  AIFeedback,
  FeedbackAggregation,

  // Config
  CONFIG
};

