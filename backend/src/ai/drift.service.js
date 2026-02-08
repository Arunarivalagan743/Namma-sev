/**
 * Drift Detection & Retraining Triggers Service
 *
 * Phase 5 Feature 7: Monitor for model/data drift and generate alerts
 *
 * Triggers when:
 * - Accuracy < threshold
 * - Overrides > threshold
 * - Confidence drops
 * - Data distribution shifts
 *
 * NOTE: Does NOT auto-retrain. Human approval required.
 */

const mongoose = require('mongoose');

// Configuration
const CONFIG = {
  // Accuracy thresholds
  accuracyThresholds: {
    critical: 0.60,
    warning: 0.75,
    healthy: 0.85
  },

  // Override rate thresholds
  overrideThresholds: {
    critical: 0.30,
    warning: 0.15,
    healthy: 0.05
  },

  // Confidence drift thresholds
  confidenceDriftThreshold: 0.15,  // 15% change

  // Distribution drift threshold (using simple statistic)
  distributionDriftThreshold: 0.20,

  // Minimum samples for drift detection
  minSamplesForDrift: 50,

  // Alert cooldown (don't repeat same alert within this period)
  alertCooldownMs: 24 * 60 * 60 * 1000,  // 24 hours

  // Check interval
  checkIntervalMs: 6 * 60 * 60 * 1000  // 6 hours
};

// Drift alert schema
const DriftAlertSchema = new mongoose.Schema({
  _id: String,
  service: {
    type: String,
    required: true,
    enum: ['enrichment', 'duplicate', 'summarization', 'system'],
    index: true
  },
  alertType: {
    type: String,
    required: true,
    enum: ['accuracy_drop', 'override_spike', 'confidence_drift', 'distribution_shift', 'retraining_recommended'],
    index: true
  },
  severity: {
    type: String,
    required: true,
    enum: ['info', 'warning', 'critical']
  },
  message: String,
  details: mongoose.Schema.Types.Mixed,
  metrics: {
    current: mongoose.Schema.Types.Mixed,
    previous: mongoose.Schema.Types.Mixed,
    threshold: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved', 'dismissed'],
    default: 'active',
    index: true
  },
  acknowledgedBy: String,
  acknowledgedAt: Date,
  resolvedBy: String,
  resolvedAt: Date,
  resolution: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  collection: 'ai_drift_alerts'
});

DriftAlertSchema.index({ service: 1, alertType: 1, status: 1 });
DriftAlertSchema.index({ severity: 1, status: 1 });

let DriftAlert;
try {
  DriftAlert = mongoose.model('DriftAlert');
} catch {
  DriftAlert = mongoose.model('DriftAlert', DriftAlertSchema);
}

// Retraining request schema
const RetrainingRequestSchema = new mongoose.Schema({
  _id: String,
  service: {
    type: String,
    required: true,
    index: true
  },
  reason: String,
  triggeredBy: {
    type: String,
    enum: ['drift_detection', 'manual', 'scheduled']
  },
  alertIds: [String],
  metrics: mongoose.Schema.Types.Mixed,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending',
    index: true
  },
  reviewedBy: String,
  reviewedAt: Date,
  reviewNotes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'ai_retraining_requests'
});

let RetrainingRequest;
try {
  RetrainingRequest = mongoose.model('RetrainingRequest');
} catch {
  RetrainingRequest = mongoose.model('RetrainingRequest', RetrainingRequestSchema);
}

/**
 * Generate unique ID
 */
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if similar alert exists within cooldown period
 */
const hasRecentAlert = async (service, alertType) => {
  const cooldownStart = new Date(Date.now() - CONFIG.alertCooldownMs);

  const existingAlert = await DriftAlert.findOne({
    service,
    alertType,
    status: { $in: ['active', 'acknowledged'] },
    createdAt: { $gte: cooldownStart }
  });

  return !!existingAlert;
};

/**
 * Create drift alert
 */
const createAlert = async (data) => {
  try {
    // Check cooldown
    if (await hasRecentAlert(data.service, data.alertType)) {
      return { success: false, reason: 'Similar alert exists within cooldown period' };
    }

    const alert = new DriftAlert({
      _id: `alert-${generateId()}`,
      ...data
    });

    await alert.save();

    console.log(`[Drift] Alert created: ${data.service} - ${data.alertType} (${data.severity})`);

    return { success: true, alertId: alert._id };
  } catch (error) {
    console.error('[Drift] Create alert error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Check accuracy drift
 */
const checkAccuracyDrift = async (service, currentMetrics, previousMetrics) => {
  if (!currentMetrics?.accuracy) return null;

  const accuracy = currentMetrics.accuracy;
  let severity = null;
  let message = null;

  if (accuracy < CONFIG.accuracyThresholds.critical) {
    severity = 'critical';
    message = `${service} accuracy critically low at ${Math.round(accuracy * 100)}%`;
  } else if (accuracy < CONFIG.accuracyThresholds.warning) {
    severity = 'warning';
    message = `${service} accuracy below warning threshold at ${Math.round(accuracy * 100)}%`;
  }

  // Check for significant drop from previous
  if (previousMetrics?.accuracy && !severity) {
    const drop = previousMetrics.accuracy - accuracy;
    if (drop > 0.15) {
      severity = 'warning';
      message = `${service} accuracy dropped ${Math.round(drop * 100)}% from previous period`;
    }
  }

  if (severity) {
    return {
      service,
      alertType: 'accuracy_drop',
      severity,
      message,
      metrics: {
        current: { accuracy },
        previous: { accuracy: previousMetrics?.accuracy },
        threshold: CONFIG.accuracyThresholds
      }
    };
  }

  return null;
};

/**
 * Check override rate spike
 */
const checkOverrideSpike = async (service, currentMetrics, previousMetrics) => {
  if (!currentMetrics?.overrideRate) return null;

  const rate = currentMetrics.overrideRate;
  let severity = null;
  let message = null;

  if (rate > CONFIG.overrideThresholds.critical) {
    severity = 'critical';
    message = `${service} override rate critically high at ${Math.round(rate * 100)}%`;
  } else if (rate > CONFIG.overrideThresholds.warning) {
    severity = 'warning';
    message = `${service} override rate above warning threshold at ${Math.round(rate * 100)}%`;
  }

  // Check for significant increase
  if (previousMetrics?.overrideRate && !severity) {
    const increase = rate - previousMetrics.overrideRate;
    if (increase > 0.10) {
      severity = 'warning';
      message = `${service} override rate increased ${Math.round(increase * 100)}% from previous period`;
    }
  }

  if (severity) {
    return {
      service,
      alertType: 'override_spike',
      severity,
      message,
      metrics: {
        current: { overrideRate: rate },
        previous: { overrideRate: previousMetrics?.overrideRate },
        threshold: CONFIG.overrideThresholds
      }
    };
  }

  return null;
};

/**
 * Check confidence drift
 */
const checkConfidenceDrift = async (service, currentMetrics, previousMetrics) => {
  if (!currentMetrics?.avgConfidence || !previousMetrics?.avgConfidence) return null;

  const change = Math.abs(currentMetrics.avgConfidence - previousMetrics.avgConfidence);

  if (change > CONFIG.confidenceDriftThreshold) {
    const direction = currentMetrics.avgConfidence < previousMetrics.avgConfidence ? 'dropped' : 'increased';

    return {
      service,
      alertType: 'confidence_drift',
      severity: 'warning',
      message: `${service} average confidence ${direction} by ${Math.round(change * 100)}%`,
      metrics: {
        current: { avgConfidence: currentMetrics.avgConfidence },
        previous: { avgConfidence: previousMetrics.avgConfidence },
        threshold: { drift: CONFIG.confidenceDriftThreshold }
      }
    };
  }

  return null;
};

/**
 * Check category distribution shift
 */
const checkDistributionShift = async (service, currentDistribution, previousDistribution) => {
  if (!currentDistribution || !previousDistribution) return null;

  // Simple chi-square-like statistic
  let totalShift = 0;
  const categories = new Set([
    ...Object.keys(currentDistribution),
    ...Object.keys(previousDistribution)
  ]);

  const currentTotal = Object.values(currentDistribution).reduce((s, v) => s + v, 0);
  const previousTotal = Object.values(previousDistribution).reduce((s, v) => s + v, 0);

  if (currentTotal < CONFIG.minSamplesForDrift || previousTotal < CONFIG.minSamplesForDrift) {
    return null;
  }

  categories.forEach(cat => {
    const currentPct = (currentDistribution[cat] || 0) / currentTotal;
    const previousPct = (previousDistribution[cat] || 0) / previousTotal;
    totalShift += Math.abs(currentPct - previousPct);
  });

  totalShift = totalShift / 2;  // Normalize

  if (totalShift > CONFIG.distributionDriftThreshold) {
    return {
      service,
      alertType: 'distribution_shift',
      severity: 'info',
      message: `${service} input distribution shifted by ${Math.round(totalShift * 100)}%`,
      metrics: {
        current: currentDistribution,
        previous: previousDistribution,
        threshold: { shift: CONFIG.distributionDriftThreshold }
      }
    };
  }

  return null;
};

/**
 * Run full drift check for a service
 */
const checkServiceDrift = async (service) => {
  const alerts = [];

  try {
    const evaluation = require('./evaluation.service');
    const metrics = await evaluation.getMetricsTrend(service, 2);

    if (metrics.length < 1) {
      return { service, alerts: [], message: 'Insufficient data' };
    }

    const current = metrics[metrics.length - 1]?.metrics;
    const previous = metrics.length > 1 ? metrics[metrics.length - 2]?.metrics : null;

    // Check all drift types
    const accuracyAlert = await checkAccuracyDrift(service, current, previous);
    if (accuracyAlert) alerts.push(accuracyAlert);

    const overrideAlert = await checkOverrideSpike(service, current, previous);
    if (overrideAlert) alerts.push(overrideAlert);

    const confidenceAlert = await checkConfidenceDrift(service, current, previous);
    if (confidenceAlert) alerts.push(confidenceAlert);

    // Create alerts in database
    for (const alertData of alerts) {
      await createAlert(alertData);
    }

    return { service, alerts, currentMetrics: current };
  } catch (error) {
    console.error(`[Drift] Check ${service} error:`, error.message);
    return { service, alerts: [], error: error.message };
  }
};

/**
 * Run drift check for all services
 */
const runDriftCheck = async () => {
  const services = ['enrichment', 'duplicate', 'summarization'];
  const results = [];

  console.log('[Drift] Running drift check...');

  for (const service of services) {
    const result = await checkServiceDrift(service);
    results.push(result);
  }

  // Check if retraining should be recommended
  const criticalAlerts = results.flatMap(r => r.alerts).filter(a => a.severity === 'critical');

  if (criticalAlerts.length > 0) {
    await createAlert({
      service: 'system',
      alertType: 'retraining_recommended',
      severity: 'critical',
      message: `Retraining recommended due to ${criticalAlerts.length} critical alert(s)`,
      details: {
        triggeredBy: criticalAlerts.map(a => `${a.service}: ${a.alertType}`)
      }
    });
  }

  return {
    timestamp: new Date().toISOString(),
    results,
    totalAlerts: results.reduce((sum, r) => sum + r.alerts.length, 0),
    criticalCount: criticalAlerts.length
  };
};

/**
 * Get active alerts
 */
const getActiveAlerts = async (options = {}) => {
  const { service, severity, limit = 50 } = options;

  const query = { status: 'active' };
  if (service) query.service = service;
  if (severity) query.severity = severity;

  const alerts = await DriftAlert.find(query)
    .sort({ severity: 1, createdAt: -1 })  // Critical first
    .limit(limit)
    .lean();

  return alerts;
};

/**
 * Acknowledge alert
 */
const acknowledgeAlert = async (alertId, userId) => {
  try {
    await DriftAlert.findByIdAndUpdate(alertId, {
      status: 'acknowledged',
      acknowledgedBy: userId,
      acknowledgedAt: new Date()
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Resolve alert
 */
const resolveAlert = async (alertId, userId, resolution) => {
  try {
    await DriftAlert.findByIdAndUpdate(alertId, {
      status: 'resolved',
      resolvedBy: userId,
      resolvedAt: new Date(),
      resolution
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Dismiss alert
 */
const dismissAlert = async (alertId, userId, reason) => {
  try {
    await DriftAlert.findByIdAndUpdate(alertId, {
      status: 'dismissed',
      resolvedBy: userId,
      resolvedAt: new Date(),
      resolution: `Dismissed: ${reason}`
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Create retraining request (requires human approval)
 */
const createRetrainingRequest = async (data) => {
  try {
    const request = new RetrainingRequest({
      _id: `retrain-${generateId()}`,
      service: data.service,
      reason: data.reason,
      triggeredBy: data.triggeredBy || 'manual',
      alertIds: data.alertIds || [],
      metrics: data.metrics
    });

    await request.save();

    return { success: true, requestId: request._id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Review retraining request (approve/reject)
 */
const reviewRetrainingRequest = async (requestId, decision, reviewerId, notes) => {
  try {
    const update = {
      status: decision === 'approve' ? 'approved' : 'rejected',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNotes: notes
    };

    await RetrainingRequest.findByIdAndUpdate(requestId, update);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get pending retraining requests
 */
const getPendingRetrainingRequests = async () => {
  return await RetrainingRequest.find({ status: 'pending' })
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Get drift statistics
 */
const getDriftStats = async () => {
  const alertCounts = await DriftAlert.aggregate([
    { $group: { _id: { service: '$service', status: '$status' }, count: { $sum: 1 } } }
  ]);

  const retrainingCounts = await RetrainingRequest.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  return {
    alerts: {
      total: await DriftAlert.countDocuments(),
      active: await DriftAlert.countDocuments({ status: 'active' }),
      byService: alertCounts
    },
    retraining: {
      total: await RetrainingRequest.countDocuments(),
      pending: await RetrainingRequest.countDocuments({ status: 'pending' }),
      byStatus: Object.fromEntries(retrainingCounts.map(r => [r._id, r.count]))
    },
    config: CONFIG
  };
};

module.exports = {
  // Drift checks
  checkServiceDrift,
  runDriftCheck,
  checkAccuracyDrift,
  checkOverrideSpike,
  checkConfidenceDrift,
  checkDistributionShift,

  // Alerts
  createAlert,
  getActiveAlerts,
  acknowledgeAlert,
  resolveAlert,
  dismissAlert,

  // Retraining
  createRetrainingRequest,
  reviewRetrainingRequest,
  getPendingRetrainingRequests,

  // Stats
  getDriftStats,

  // Models
  DriftAlert,
  RetrainingRequest,

  // Config
  CONFIG
};

