/**
 * AI Quality Evaluation Service
 *
 * Phase 5 Feature 1: Automated evaluation for AI accuracy and quality
 *
 * Tracks:
 * - Context enrichment precision
 * - Duplicate detection accuracy
 * - Summary correctness
 * - Suggestion acceptance rate
 *
 * Metrics:
 * - Precision, Recall, F1
 * - Confidence calibration
 * - Override rate
 * - Drift indicators
 */

const mongoose = require('mongoose');
const cache = require('./cache');

// Configuration
const CONFIG = {
  evaluationWindow: 7 * 24 * 60 * 60 * 1000,  // 7 days
  minSamplesForMetrics: 10,
  accuracyThreshold: 0.75,
  overrideAlertThreshold: 0.20,
  confidenceCalibrationBins: 10,
  cachePrefix: 'eval:',
  cacheTtlMs: 60 * 60 * 1000  // 1 hour
};

// Evaluation metrics schema
const EvaluationMetricsSchema = new mongoose.Schema({
  _id: String,
  service: {
    type: String,
    required: true,
    enum: ['enrichment', 'duplicate', 'summarization'],
    index: true
  },
  period: {
    type: String,  // 'daily', 'weekly', 'monthly'
    required: true
  },
  periodStart: {
    type: Date,
    required: true,
    index: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  metrics: {
    totalPredictions: { type: Number, default: 0 },
    correctPredictions: { type: Number, default: 0 },
    falsePositives: { type: Number, default: 0 },
    falseNegatives: { type: Number, default: 0 },
    truePositives: { type: Number, default: 0 },
    trueNegatives: { type: Number, default: 0 },
    precision: { type: Number, default: null },
    recall: { type: Number, default: null },
    f1Score: { type: Number, default: null },
    accuracy: { type: Number, default: null },
    avgConfidence: { type: Number, default: null },
    overrideRate: { type: Number, default: null },
    acceptanceRate: { type: Number, default: null }
  },
  confidenceDistribution: [{
    bin: Number,  // 0-9 representing 0-10%, 10-20%, etc.
    count: Number,
    correctCount: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'ai_evaluation_metrics'
});

EvaluationMetricsSchema.index({ service: 1, periodStart: -1 });

let EvaluationMetrics;
try {
  EvaluationMetrics = mongoose.model('EvaluationMetrics');
} catch {
  EvaluationMetrics = mongoose.model('EvaluationMetrics', EvaluationMetricsSchema);
}

// Prediction log schema (for tracking individual predictions)
const PredictionLogSchema = new mongoose.Schema({
  _id: String,
  service: {
    type: String,
    required: true,
    enum: ['enrichment', 'duplicate', 'summarization'],
    index: true
  },
  predictionType: {
    type: String,
    required: true
  },
  inputHash: String,
  prediction: mongoose.Schema.Types.Mixed,
  confidence: Number,
  groundTruth: mongoose.Schema.Types.Mixed,
  isCorrect: { type: Boolean, default: null },
  wasOverridden: { type: Boolean, default: false },
  overrideReason: String,
  overriddenBy: String,
  feedback: {
    helpful: { type: Boolean, default: null },
    reason: String,
    timestamp: Date
  },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  collection: 'ai_prediction_logs'
});

PredictionLogSchema.index({ service: 1, createdAt: -1 });
PredictionLogSchema.index({ isCorrect: 1, service: 1 });
PredictionLogSchema.index({ wasOverridden: 1, service: 1 });

let PredictionLog;
try {
  PredictionLog = mongoose.model('PredictionLog');
} catch {
  PredictionLog = mongoose.model('PredictionLog', PredictionLogSchema);
}

/**
 * Generate unique ID
 */
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Log a prediction for later evaluation
 */
const logPrediction = async (service, predictionType, data) => {
  try {
    const log = new PredictionLog({
      _id: generateId(),
      service,
      predictionType,
      inputHash: data.inputHash || null,
      prediction: data.prediction,
      confidence: data.confidence,
      groundTruth: data.groundTruth || null,
      isCorrect: data.isCorrect ?? null,
      metadata: data.metadata || {}
    });

    await log.save();
    return log._id;
  } catch (error) {
    console.error('[Evaluation] Log prediction error:', error.message);
    return null;
  }
};

/**
 * Record feedback for a prediction
 */
const recordFeedback = async (predictionId, feedback) => {
  try {
    const update = {
      'feedback.helpful': feedback.helpful,
      'feedback.reason': feedback.reason || null,
      'feedback.timestamp': new Date()
    };

    // If feedback indicates incorrect, mark as such
    if (feedback.helpful === false && feedback.markIncorrect) {
      update.isCorrect = false;
    }

    await PredictionLog.findByIdAndUpdate(predictionId, update);
    return { success: true };
  } catch (error) {
    console.error('[Evaluation] Record feedback error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Record an override
 */
const recordOverride = async (predictionId, overrideData) => {
  try {
    await PredictionLog.findByIdAndUpdate(predictionId, {
      wasOverridden: true,
      overrideReason: overrideData.reason,
      overriddenBy: overrideData.adminId,
      isCorrect: false  // Override implies prediction was wrong
    });
    return { success: true };
  } catch (error) {
    console.error('[Evaluation] Record override error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Calculate precision, recall, F1
 */
const calculateMetrics = (tp, fp, fn, tn) => {
  const precision = tp + fp > 0 ? tp / (tp + fp) : null;
  const recall = tp + fn > 0 ? tp / (tp + fn) : null;
  const f1Score = precision && recall ? 2 * (precision * recall) / (precision + recall) : null;
  const accuracy = tp + fp + fn + tn > 0 ? (tp + tn) / (tp + fp + fn + tn) : null;

  return {
    precision: precision ? Math.round(precision * 1000) / 1000 : null,
    recall: recall ? Math.round(recall * 1000) / 1000 : null,
    f1Score: f1Score ? Math.round(f1Score * 1000) / 1000 : null,
    accuracy: accuracy ? Math.round(accuracy * 1000) / 1000 : null
  };
};

/**
 * Calculate confidence calibration
 * Measures if confidence scores match actual accuracy
 */
const calculateCalibration = (predictions) => {
  const bins = Array(CONFIG.confidenceCalibrationBins).fill(null).map((_, i) => ({
    bin: i,
    count: 0,
    correctCount: 0
  }));

  predictions.forEach(p => {
    if (p.confidence !== null && p.isCorrect !== null) {
      const binIndex = Math.min(Math.floor(p.confidence * CONFIG.confidenceCalibrationBins), CONFIG.confidenceCalibrationBins - 1);
      bins[binIndex].count++;
      if (p.isCorrect) bins[binIndex].correctCount++;
    }
  });

  // Calculate expected calibration error (ECE)
  let ece = 0;
  let totalSamples = 0;

  bins.forEach((bin, i) => {
    if (bin.count > 0) {
      const actualAccuracy = bin.correctCount / bin.count;
      const expectedAccuracy = (i + 0.5) / CONFIG.confidenceCalibrationBins;
      ece += bin.count * Math.abs(actualAccuracy - expectedAccuracy);
      totalSamples += bin.count;
    }
  });

  return {
    bins,
    ece: totalSamples > 0 ? Math.round((ece / totalSamples) * 1000) / 1000 : null
  };
};

/**
 * Compute evaluation metrics for a service over a time period
 */
const computeMetrics = async (service, startDate, endDate) => {
  try {
    const predictions = await PredictionLog.find({
      service,
      createdAt: { $gte: startDate, $lt: endDate }
    }).lean();

    if (predictions.length < CONFIG.minSamplesForMetrics) {
      return {
        service,
        period: { start: startDate, end: endDate },
        insufficient: true,
        sampleCount: predictions.length,
        minRequired: CONFIG.minSamplesForMetrics
      };
    }

    // Count outcomes
    let tp = 0, fp = 0, fn = 0, tn = 0;
    let totalConfidence = 0;
    let confidenceCount = 0;
    let overrideCount = 0;
    let feedbackHelpful = 0;
    let feedbackTotal = 0;

    predictions.forEach(p => {
      // For binary predictions (duplicate detection)
      if (p.isCorrect === true) {
        if (p.prediction) tp++; else tn++;
      } else if (p.isCorrect === false) {
        if (p.prediction) fp++; else fn++;
      }

      if (p.confidence !== null) {
        totalConfidence += p.confidence;
        confidenceCount++;
      }

      if (p.wasOverridden) overrideCount++;

      if (p.feedback?.helpful !== null) {
        feedbackTotal++;
        if (p.feedback.helpful) feedbackHelpful++;
      }
    });

    const baseMetrics = calculateMetrics(tp, fp, fn, tn);
    const calibration = calculateCalibration(predictions);

    return {
      service,
      period: { start: startDate, end: endDate },
      sampleCount: predictions.length,
      metrics: {
        ...baseMetrics,
        truePositives: tp,
        falsePositives: fp,
        falseNegatives: fn,
        trueNegatives: tn,
        avgConfidence: confidenceCount > 0 ? Math.round((totalConfidence / confidenceCount) * 1000) / 1000 : null,
        overrideRate: predictions.length > 0 ? Math.round((overrideCount / predictions.length) * 1000) / 1000 : null,
        acceptanceRate: feedbackTotal > 0 ? Math.round((feedbackHelpful / feedbackTotal) * 1000) / 1000 : null
      },
      calibration
    };
  } catch (error) {
    console.error('[Evaluation] Compute metrics error:', error.message);
    return { error: error.message };
  }
};

/**
 * Store computed metrics
 */
const storeMetrics = async (service, period, periodStart, periodEnd, metrics) => {
  try {
    const id = `${service}-${period}-${periodStart.toISOString().split('T')[0]}`;

    await EvaluationMetrics.findOneAndUpdate(
      { _id: id },
      {
        service,
        period,
        periodStart,
        periodEnd,
        metrics: metrics.metrics,
        confidenceDistribution: metrics.calibration?.bins || []
      },
      { upsert: true, new: true }
    );

    return { success: true, id };
  } catch (error) {
    console.error('[Evaluation] Store metrics error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get historical metrics for trend analysis
 */
const getMetricsTrend = async (service, periods = 12) => {
  try {
    const metrics = await EvaluationMetrics.find({ service })
      .sort({ periodStart: -1 })
      .limit(periods)
      .lean();

    return metrics.reverse();
  } catch (error) {
    console.error('[Evaluation] Get trends error:', error.message);
    return [];
  }
};

/**
 * Detect drift in metrics
 */
const detectDrift = async (service) => {
  const recentMetrics = await getMetricsTrend(service, 4);

  if (recentMetrics.length < 2) {
    return { hasDrift: false, reason: 'Insufficient data' };
  }

  const alerts = [];
  const latest = recentMetrics[recentMetrics.length - 1];
  const previous = recentMetrics[recentMetrics.length - 2];

  // Check accuracy drop
  if (latest.metrics?.accuracy && previous.metrics?.accuracy) {
    const drop = previous.metrics.accuracy - latest.metrics.accuracy;
    if (drop > 0.1) {
      alerts.push({
        type: 'accuracy_drop',
        severity: drop > 0.2 ? 'high' : 'medium',
        message: `Accuracy dropped by ${Math.round(drop * 100)}%`,
        current: latest.metrics.accuracy,
        previous: previous.metrics.accuracy
      });
    }
  }

  // Check override rate spike
  if (latest.metrics?.overrideRate && previous.metrics?.overrideRate) {
    const increase = latest.metrics.overrideRate - previous.metrics.overrideRate;
    if (increase > 0.1 || latest.metrics.overrideRate > CONFIG.overrideAlertThreshold) {
      alerts.push({
        type: 'override_spike',
        severity: latest.metrics.overrideRate > 0.3 ? 'high' : 'medium',
        message: `Override rate at ${Math.round(latest.metrics.overrideRate * 100)}%`,
        current: latest.metrics.overrideRate,
        previous: previous.metrics.overrideRate
      });
    }
  }

  // Check confidence calibration
  if (latest.calibration?.ece && latest.calibration.ece > 0.15) {
    alerts.push({
      type: 'calibration_error',
      severity: latest.calibration.ece > 0.25 ? 'high' : 'medium',
      message: `Confidence calibration error at ${Math.round(latest.calibration.ece * 100)}%`,
      ece: latest.calibration.ece
    });
  }

  return {
    hasDrift: alerts.length > 0,
    alerts,
    recommendation: alerts.some(a => a.severity === 'high')
      ? 'Consider manual review and potential retraining'
      : alerts.length > 0
        ? 'Monitor closely'
        : 'System healthy'
  };
};

/**
 * Get quality summary for all services
 */
const getQualitySummary = async () => {
  const services = ['enrichment', 'duplicate', 'summarization'];
  const summary = {};

  for (const service of services) {
    const endDate = new Date();
    const startDate = new Date(Date.now() - CONFIG.evaluationWindow);

    const metrics = await computeMetrics(service, startDate, endDate);
    const drift = await detectDrift(service);

    summary[service] = {
      metrics: metrics.metrics || null,
      sampleCount: metrics.sampleCount || 0,
      drift,
      healthy: !drift.hasDrift && (metrics.metrics?.accuracy ?? 1) >= CONFIG.accuracyThreshold
    };
  }

  return {
    summary,
    evaluationWindow: `${CONFIG.evaluationWindow / (24 * 60 * 60 * 1000)} days`,
    timestamp: new Date().toISOString()
  };
};

/**
 * Get false positive/negative queue for review
 */
const getErrorQueue = async (service, errorType = 'all', limit = 50) => {
  try {
    const query = { service };

    if (errorType === 'false_positive') {
      query.isCorrect = false;
      query.prediction = true;
    } else if (errorType === 'false_negative') {
      query.isCorrect = false;
      query.prediction = false;
    } else if (errorType === 'overridden') {
      query.wasOverridden = true;
    } else {
      query.isCorrect = false;
    }

    const errors = await PredictionLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return errors;
  } catch (error) {
    console.error('[Evaluation] Get error queue error:', error.message);
    return [];
  }
};

/**
 * Run daily evaluation job
 */
const runDailyEvaluation = async () => {
  const services = ['enrichment', 'duplicate', 'summarization'];
  const results = [];

  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 1);

  for (const service of services) {
    const metrics = await computeMetrics(service, startDate, endDate);
    if (!metrics.error && !metrics.insufficient) {
      await storeMetrics(service, 'daily', startDate, endDate, metrics);
    }
    results.push({ service, ...metrics });
  }

  return results;
};

/**
 * Get evaluation statistics
 */
const getEvaluationStats = async () => {
  const totalLogs = await PredictionLog.countDocuments();
  const totalMetrics = await EvaluationMetrics.countDocuments();

  const serviceCounts = await PredictionLog.aggregate([
    { $group: { _id: '$service', count: { $sum: 1 } } }
  ]);

  return {
    totalPredictionLogs: totalLogs,
    totalMetricRecords: totalMetrics,
    byService: Object.fromEntries(serviceCounts.map(s => [s._id, s.count])),
    config: CONFIG
  };
};

module.exports = {
  // Core functions
  logPrediction,
  recordFeedback,
  recordOverride,
  computeMetrics,
  storeMetrics,

  // Analysis
  getMetricsTrend,
  detectDrift,
  getQualitySummary,
  getErrorQueue,

  // Jobs
  runDailyEvaluation,

  // Stats
  getEvaluationStats,
  calculateMetrics,
  calculateCalibration,

  // Models (for direct access if needed)
  EvaluationMetrics,
  PredictionLog,

  // Config
  CONFIG
};

