/**
 * System Metrics & Health Monitoring
 *
 * Phase 3 Feature 4: Centralized metrics and alerting
 *
 * Tracks:
 * - Queue depth
 * - Cache hit rates
 * - API latency
 * - Memory usage
 * - Error rates
 *
 * Provides:
 * - /health endpoint
 * - /metrics endpoint
 * - Alert thresholds
 */

// Metrics storage (rolling windows)
const metrics = {
  // Request metrics (last 1000 requests)
  requests: {
    total: 0,
    errors: 0,
    latencies: [],  // Rolling window of last 100
    maxLatencyWindow: 100
  },

  // Cache metrics
  cache: {
    hits: 0,
    misses: 0,
    evictions: 0
  },

  // AI service metrics
  ai: {
    classifications: 0,
    priorityScores: 0,
    duplicateChecks: 0,
    searches: 0,
    errors: 0
  },

  // System metrics
  system: {
    startTime: Date.now(),
    lastCheck: null,
    memorySnapshots: []  // Rolling window
  }
};

// Alert thresholds
const ALERT_THRESHOLDS = {
  errorRatePercent: 5,
  p95LatencyMs: 300,
  memoryMB: 100,
  cacheHitRatePercent: 70,
  queueDepth: 50
};

// Active alerts
const activeAlerts = [];

/**
 * Record a request metric
 */
const recordRequest = (latencyMs, isError = false) => {
  metrics.requests.total++;
  if (isError) metrics.requests.errors++;

  // Add to latency window
  metrics.requests.latencies.push(latencyMs);
  if (metrics.requests.latencies.length > metrics.requests.maxLatencyWindow) {
    metrics.requests.latencies.shift();
  }
};

/**
 * Record cache operation
 */
const recordCacheOp = (hit) => {
  if (hit) {
    metrics.cache.hits++;
  } else {
    metrics.cache.misses++;
  }
};

/**
 * Record AI service usage
 */
const recordAIOp = (service, isError = false) => {
  if (isError) {
    metrics.ai.errors++;
    return;
  }

  switch (service) {
    case 'classification':
      metrics.ai.classifications++;
      break;
    case 'priority':
      metrics.ai.priorityScores++;
      break;
    case 'duplicate':
      metrics.ai.duplicateChecks++;
      break;
    case 'search':
      metrics.ai.searches++;
      break;
  }
};

/**
 * Calculate percentile from array
 */
const percentile = (arr, p) => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil(p / 100 * sorted.length) - 1;
  return sorted[Math.max(0, index)];
};

/**
 * Get current metrics summary
 */
const getMetrics = () => {
  const now = Date.now();
  const uptime = now - metrics.system.startTime;
  const memUsage = process.memoryUsage();

  // Calculate request stats
  const errorRate = metrics.requests.total > 0
    ? (metrics.requests.errors / metrics.requests.total * 100)
    : 0;

  const latencies = metrics.requests.latencies;
  const p50 = percentile(latencies, 50);
  const p95 = percentile(latencies, 95);
  const p99 = percentile(latencies, 99);

  // Calculate cache hit rate
  const cacheTotal = metrics.cache.hits + metrics.cache.misses;
  const cacheHitRate = cacheTotal > 0
    ? (metrics.cache.hits / cacheTotal * 100)
    : 100;

  return {
    uptime: {
      ms: uptime,
      formatted: formatUptime(uptime)
    },
    requests: {
      total: metrics.requests.total,
      errors: metrics.requests.errors,
      errorRate: errorRate.toFixed(2) + '%',
      latency: {
        p50: Math.round(p50),
        p95: Math.round(p95),
        p99: Math.round(p99)
      }
    },
    cache: {
      hits: metrics.cache.hits,
      misses: metrics.cache.misses,
      hitRate: cacheHitRate.toFixed(2) + '%'
    },
    ai: {
      classifications: metrics.ai.classifications,
      priorityScores: metrics.ai.priorityScores,
      duplicateChecks: metrics.ai.duplicateChecks,
      searches: metrics.ai.searches,
      errors: metrics.ai.errors
    },
    memory: {
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
      rssMB: Math.round(memUsage.rss / 1024 / 1024)
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * Format uptime to human readable
 */
const formatUptime = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

/**
 * Check health and generate alerts
 */
const checkHealth = () => {
  const currentMetrics = getMetrics();
  const alerts = [];

  // Check error rate
  const errorRate = parseFloat(currentMetrics.requests.errorRate);
  if (errorRate > ALERT_THRESHOLDS.errorRatePercent) {
    alerts.push({
      level: 'warning',
      type: 'error_rate',
      message: `Error rate ${errorRate.toFixed(1)}% exceeds threshold ${ALERT_THRESHOLDS.errorRatePercent}%`,
      value: errorRate
    });
  }

  // Check P95 latency
  const p95 = currentMetrics.requests.latency.p95;
  if (p95 > ALERT_THRESHOLDS.p95LatencyMs) {
    alerts.push({
      level: 'warning',
      type: 'latency',
      message: `P95 latency ${p95}ms exceeds threshold ${ALERT_THRESHOLDS.p95LatencyMs}ms`,
      value: p95
    });
  }

  // Check memory
  const memMB = currentMetrics.memory.heapUsedMB;
  if (memMB > ALERT_THRESHOLDS.memoryMB) {
    alerts.push({
      level: 'critical',
      type: 'memory',
      message: `Memory usage ${memMB}MB exceeds threshold ${ALERT_THRESHOLDS.memoryMB}MB`,
      value: memMB
    });
  }

  // Check cache hit rate
  const hitRate = parseFloat(currentMetrics.cache.hitRate);
  if (hitRate < ALERT_THRESHOLDS.cacheHitRatePercent &&
      (metrics.cache.hits + metrics.cache.misses) > 100) {
    alerts.push({
      level: 'warning',
      type: 'cache_hit_rate',
      message: `Cache hit rate ${hitRate.toFixed(1)}% below threshold ${ALERT_THRESHOLDS.cacheHitRatePercent}%`,
      value: hitRate
    });
  }

  // Update active alerts
  activeAlerts.length = 0;
  activeAlerts.push(...alerts);

  metrics.system.lastCheck = new Date();

  return {
    healthy: alerts.filter(a => a.level === 'critical').length === 0,
    status: alerts.length === 0 ? 'healthy' : alerts.some(a => a.level === 'critical') ? 'critical' : 'degraded',
    alerts,
    metrics: currentMetrics,
    thresholds: ALERT_THRESHOLDS
  };
};

/**
 * Get system health status
 */
const getHealth = () => {
  const health = checkHealth();

  return {
    status: health.status,
    healthy: health.healthy,
    uptime: health.metrics.uptime.formatted,
    checks: {
      memory: health.metrics.memory.heapUsedMB < ALERT_THRESHOLDS.memoryMB ? 'pass' : 'fail',
      latency: health.metrics.requests.latency.p95 < ALERT_THRESHOLDS.p95LatencyMs ? 'pass' : 'fail',
      errorRate: parseFloat(health.metrics.requests.errorRate) < ALERT_THRESHOLDS.errorRatePercent ? 'pass' : 'fail',
      cacheHitRate: parseFloat(health.metrics.cache.hitRate) > ALERT_THRESHOLDS.cacheHitRatePercent ? 'pass' : 'N/A'
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * Get active alerts
 */
const getAlerts = () => {
  return {
    count: activeAlerts.length,
    alerts: activeAlerts,
    lastCheck: metrics.system.lastCheck,
    thresholds: ALERT_THRESHOLDS
  };
};

/**
 * Reset metrics (for testing)
 */
const resetMetrics = () => {
  metrics.requests = { total: 0, errors: 0, latencies: [], maxLatencyWindow: 100 };
  metrics.cache = { hits: 0, misses: 0, evictions: 0 };
  metrics.ai = { classifications: 0, priorityScores: 0, duplicateChecks: 0, searches: 0, errors: 0 };
  activeAlerts.length = 0;
};

/**
 * Update thresholds
 */
const updateThresholds = (newThresholds) => {
  Object.assign(ALERT_THRESHOLDS, newThresholds);
  return ALERT_THRESHOLDS;
};

module.exports = {
  recordRequest,
  recordCacheOp,
  recordAIOp,
  getMetrics,
  getHealth,
  getAlerts,
  checkHealth,
  resetMetrics,
  updateThresholds,
  ALERT_THRESHOLDS
};

