/**
 * AI Health Dashboard Service
 *
 * Phase 5 Feature 5: Comprehensive AI quality monitoring
 *
 * Exposes:
 * - Accuracy trends
 * - Drift indicators
 * - Error spikes
 * - Feedback stats
 * - Confidence histograms
 */

const cache = require('./cache');

// Configuration
const CONFIG = {
  refreshIntervalMs: 5 * 60 * 1000,  // 5 minutes
  cachePrefix: 'dashboard:',
  cacheTtlMs: 5 * 60 * 1000,
  trendPeriods: 12,  // Show 12 periods (e.g., 12 days/weeks)
  healthThresholds: {
    accuracy: { healthy: 0.80, warning: 0.70 },
    overrideRate: { healthy: 0.10, warning: 0.20 },
    helpfulRate: { healthy: 0.70, warning: 0.50 },
    latency: { healthy: 50, warning: 100 },
    errorRate: { healthy: 0.02, warning: 0.05 }
  }
};

// Health status enum
const HealthStatus = {
  HEALTHY: 'healthy',
  WARNING: 'warning',
  CRITICAL: 'critical',
  UNKNOWN: 'unknown'
};

/**
 * Calculate health status from value and thresholds
 */
const calculateStatus = (value, thresholds, higherIsBetter = true) => {
  if (value === null || value === undefined) return HealthStatus.UNKNOWN;

  if (higherIsBetter) {
    if (value >= thresholds.healthy) return HealthStatus.HEALTHY;
    if (value >= thresholds.warning) return HealthStatus.WARNING;
    return HealthStatus.CRITICAL;
  } else {
    if (value <= thresholds.healthy) return HealthStatus.HEALTHY;
    if (value <= thresholds.warning) return HealthStatus.WARNING;
    return HealthStatus.CRITICAL;
  }
};

/**
 * Get overall system health
 */
const getSystemHealth = async () => {
  try {
    let evaluation, feedback;

    try {
      evaluation = require('./evaluation.service');
    } catch (e) { /* not loaded */ }

    try {
      feedback = require('./feedback.service');
    } catch (e) { /* not loaded */ }

    const health = {
      timestamp: new Date().toISOString(),
      overall: HealthStatus.UNKNOWN,
      services: {},
      alerts: [],
      metrics: {}
    };

    // Get quality summary from evaluation service
    if (evaluation) {
      const qualitySummary = await evaluation.getQualitySummary();

      for (const [service, data] of Object.entries(qualitySummary.summary)) {
        health.services[service] = {
          status: data.healthy ? HealthStatus.HEALTHY : HealthStatus.WARNING,
          accuracy: data.metrics?.accuracy,
          accuracyStatus: calculateStatus(data.metrics?.accuracy, CONFIG.healthThresholds.accuracy),
          overrideRate: data.metrics?.overrideRate,
          overrideStatus: calculateStatus(data.metrics?.overrideRate, CONFIG.healthThresholds.overrideRate, false),
          sampleCount: data.sampleCount,
          drift: data.drift
        };

        // Collect alerts
        if (data.drift?.alerts) {
          health.alerts.push(...data.drift.alerts.map(a => ({
            ...a,
            service
          })));
        }
      }
    }

    // Get feedback summary
    if (feedback) {
      const feedbackSummary = await feedback.getFeedbackSummary();
      health.metrics.feedback = feedbackSummary.overall;
      health.metrics.feedback.status = calculateStatus(
        feedbackSummary.overall.helpfulRate,
        CONFIG.healthThresholds.helpfulRate
      );
    }

    // Calculate overall status
    const statuses = Object.values(health.services).map(s => s.status);
    if (statuses.includes(HealthStatus.CRITICAL)) {
      health.overall = HealthStatus.CRITICAL;
    } else if (statuses.includes(HealthStatus.WARNING)) {
      health.overall = HealthStatus.WARNING;
    } else if (statuses.length > 0) {
      health.overall = HealthStatus.HEALTHY;
    }

    return health;
  } catch (error) {
    console.error('[Dashboard] Get health error:', error.message);
    return {
      timestamp: new Date().toISOString(),
      overall: HealthStatus.UNKNOWN,
      error: error.message
    };
  }
};

/**
 * Get accuracy trends for all services
 */
const getAccuracyTrends = async () => {
  try {
    const evaluation = require('./evaluation.service');
    const services = ['enrichment', 'duplicate', 'summarization'];
    const trends = {};

    for (const service of services) {
      const metricsTrend = await evaluation.getMetricsTrend(service, CONFIG.trendPeriods);

      trends[service] = metricsTrend.map(m => ({
        period: m.periodStart,
        accuracy: m.metrics?.accuracy,
        precision: m.metrics?.precision,
        recall: m.metrics?.recall,
        f1Score: m.metrics?.f1Score,
        overrideRate: m.metrics?.overrideRate,
        sampleCount: m.metrics?.totalPredictions
      }));
    }

    return {
      trends,
      periods: CONFIG.trendPeriods,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[Dashboard] Get trends error:', error.message);
    return { error: error.message };
  }
};

/**
 * Get confidence distribution histogram
 */
const getConfidenceHistogram = async (service) => {
  try {
    const evaluation = require('./evaluation.service');
    const metrics = await evaluation.getMetricsTrend(service, 1);

    if (metrics.length === 0 || !metrics[0].confidenceDistribution) {
      return { service, histogram: [], message: 'No data available' };
    }

    const histogram = metrics[0].confidenceDistribution.map(bin => ({
      range: `${bin.bin * 10}-${(bin.bin + 1) * 10}%`,
      total: bin.count,
      correct: bin.correctCount,
      accuracy: bin.count > 0 ? Math.round((bin.correctCount / bin.count) * 100) : null
    }));

    return {
      service,
      histogram,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[Dashboard] Get histogram error:', error.message);
    return { service, error: error.message };
  }
};

/**
 * Get error analysis summary
 */
const getErrorAnalysis = async () => {
  try {
    const evaluation = require('./evaluation.service');
    const services = ['enrichment', 'duplicate', 'summarization'];
    const analysis = {};

    for (const service of services) {
      const falsePositives = await evaluation.getErrorQueue(service, 'false_positive', 10);
      const falseNegatives = await evaluation.getErrorQueue(service, 'false_negative', 10);
      const overridden = await evaluation.getErrorQueue(service, 'overridden', 10);

      analysis[service] = {
        falsePositives: {
          count: falsePositives.length,
          recent: falsePositives.slice(0, 5).map(e => ({
            id: e._id,
            prediction: e.prediction,
            createdAt: e.createdAt
          }))
        },
        falseNegatives: {
          count: falseNegatives.length,
          recent: falseNegatives.slice(0, 5).map(e => ({
            id: e._id,
            prediction: e.prediction,
            createdAt: e.createdAt
          }))
        },
        overridden: {
          count: overridden.length,
          recent: overridden.slice(0, 5).map(e => ({
            id: e._id,
            reason: e.overrideReason,
            createdAt: e.createdAt
          }))
        }
      };
    }

    return {
      analysis,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[Dashboard] Get error analysis error:', error.message);
    return { error: error.message };
  }
};

/**
 * Get drift indicators
 */
const getDriftIndicators = async () => {
  try {
    const evaluation = require('./evaluation.service');
    const services = ['enrichment', 'duplicate', 'summarization'];
    const indicators = {};

    for (const service of services) {
      const drift = await evaluation.detectDrift(service);
      indicators[service] = drift;
    }

    // Check for any high severity alerts
    const hasHighSeverity = Object.values(indicators).some(
      i => i.alerts?.some(a => a.severity === 'high')
    );

    return {
      indicators,
      overallRisk: hasHighSeverity ? 'high' :
        Object.values(indicators).some(i => i.hasDrift) ? 'medium' : 'low',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[Dashboard] Get drift error:', error.message);
    return { error: error.message };
  }
};

/**
 * Get full dashboard data
 */
const getFullDashboard = async () => {
  // Check cache first
  const dashboardCache = cache.getCache('dashboard');
  const cacheKey = `${CONFIG.cachePrefix}full`;

  const cached = await dashboardCache.get(cacheKey);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  // Build dashboard
  const dashboard = {
    health: await getSystemHealth(),
    accuracyTrends: await getAccuracyTrends(),
    confidenceHistograms: {},
    errorAnalysis: await getErrorAnalysis(),
    drift: await getDriftIndicators(),
    feedbackSummary: null,
    generatedAt: new Date().toISOString(),
    fromCache: false
  };

  // Get confidence histograms for each service
  for (const service of ['enrichment', 'duplicate', 'summarization']) {
    dashboard.confidenceHistograms[service] = await getConfidenceHistogram(service);
  }

  // Get feedback summary
  try {
    const feedback = require('./feedback.service');
    dashboard.feedbackSummary = await feedback.getFeedbackSummary();
  } catch (e) { /* not loaded */ }

  // Cache result
  await dashboardCache.set(cacheKey, dashboard, { l1TtlMs: CONFIG.cacheTtlMs });

  return dashboard;
};

/**
 * Get quick health check (for status endpoints)
 */
const getQuickHealth = async () => {
  const health = await getSystemHealth();

  return {
    status: health.overall,
    services: Object.fromEntries(
      Object.entries(health.services).map(([k, v]) => [k, v.status])
    ),
    alertCount: health.alerts?.length || 0,
    timestamp: health.timestamp
  };
};

/**
 * Generate health report
 */
const generateHealthReport = async () => {
  const dashboard = await getFullDashboard();

  const report = {
    title: 'AI System Health Report',
    generatedAt: new Date().toISOString(),
    summary: {
      overallHealth: dashboard.health.overall,
      servicesHealthy: Object.values(dashboard.health.services).filter(s => s.status === 'healthy').length,
      servicesTotal: Object.keys(dashboard.health.services).length,
      activeAlerts: dashboard.health.alerts?.length || 0,
      driftRisk: dashboard.drift.overallRisk
    },
    services: {},
    recommendations: []
  };

  // Service details
  for (const [service, data] of Object.entries(dashboard.health.services)) {
    report.services[service] = {
      status: data.status,
      accuracy: data.accuracy ? `${Math.round(data.accuracy * 100)}%` : 'N/A',
      overrideRate: data.overrideRate ? `${Math.round(data.overrideRate * 100)}%` : 'N/A',
      sampleCount: data.sampleCount || 0
    };
  }

  // Generate recommendations
  for (const alert of dashboard.health.alerts || []) {
    report.recommendations.push({
      priority: alert.severity,
      service: alert.service,
      issue: alert.message,
      action: alert.type === 'accuracy_drop'
        ? 'Review recent predictions and consider model retraining'
        : alert.type === 'override_spike'
          ? 'Analyze override reasons and adjust thresholds'
          : 'Monitor and investigate'
    });
  }

  if (dashboard.drift.overallRisk === 'high') {
    report.recommendations.push({
      priority: 'high',
      issue: 'High drift risk detected',
      action: 'Schedule model review and potential retraining'
    });
  }

  return report;
};

module.exports = {
  // Health checks
  getSystemHealth,
  getQuickHealth,

  // Detailed analytics
  getAccuracyTrends,
  getConfidenceHistogram,
  getErrorAnalysis,
  getDriftIndicators,

  // Full dashboard
  getFullDashboard,
  generateHealthReport,

  // Utilities
  calculateStatus,
  HealthStatus,

  // Config
  CONFIG
};

