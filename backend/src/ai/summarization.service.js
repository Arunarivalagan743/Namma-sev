/**
 * Automated Complaint Summarization Service
 *
 * Phase 4 Feature 3: Summarize long complaint histories
 *
 * Capabilities:
 * - Generate timeline of events
 * - Extract key actions taken
 * - Show current status summary
 * - Work on complaint threads, admin remarks, status changes
 *
 * Rules:
 * - Local processing preferred
 * - Rule-based fallback
 * - Cached results
 * - Regenerate only on change
 *
 * Target latency: <60ms
 */

const preprocessor = require('./preprocessor');
const cache = require('./cache');

// Configuration
const CONFIG = {
  maxHistoryItems: 50,
  maxSummaryLength: 500,
  cachePrefix: 'summary:',
  cacheTtlMs: 60 * 60 * 1000,  // 1 hour
  versionPrefix: 'v:'
};

// Status transition labels
const STATUS_LABELS = {
  pending: { label: 'Submitted', icon: '📝', color: 'blue' },
  in_progress: { label: 'Under Review', icon: '🔄', color: 'yellow' },
  resolved: { label: 'Resolved', icon: '✅', color: 'green' },
  rejected: { label: 'Rejected', icon: '❌', color: 'red' }
};

// Action keywords for extraction
const ACTION_KEYWORDS = {
  inspection: ['inspected', 'visited', 'site visit', 'checked', 'verified', 'inspection'],
  assignment: ['assigned', 'forwarded', 'transferred', 'escalated', 'referred'],
  work: ['work started', 'repair', 'fixed', 'completed', 'done', 'resolved'],
  response: ['responded', 'replied', 'contacted', 'called', 'informed'],
  escalation: ['escalated', 'urgent', 'priority', 'supervisor', 'higher authority'],
  pending: ['pending', 'waiting', 'on hold', 'delayed', 'awaiting']
};

/**
 * Format date for timeline display
 */
const formatDate = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Calculate time between two dates
 */
const calculateDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const diffMs = end - start;

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return 'Less than an hour';
};

/**
 * Extract action type from remarks
 */
const extractActionType = (remarks) => {
  if (!remarks) return 'update';

  const lowerRemarks = remarks.toLowerCase();

  for (const [actionType, keywords] of Object.entries(ACTION_KEYWORDS)) {
    if (keywords.some(kw => lowerRemarks.includes(kw))) {
      return actionType;
    }
  }

  return 'update';
};

/**
 * Generate summary text from remarks
 */
const summarizeRemarks = (remarks, maxLength = 100) => {
  if (!remarks) return '';

  // Clean the text
  let summary = remarks
    .replace(/\s+/g, ' ')
    .trim();

  // Truncate if needed
  if (summary.length > maxLength) {
    summary = summary.substring(0, maxLength);
    const lastSpace = summary.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.7) {
      summary = summary.substring(0, lastSpace);
    }
    summary += '...';
  }

  return summary;
};

/**
 * Build timeline from complaint history
 */
const buildTimeline = (complaint, history) => {
  const timeline = [];

  // Add creation event
  timeline.push({
    date: complaint.createdAt,
    formattedDate: formatDate(complaint.createdAt),
    type: 'created',
    status: 'pending',
    statusInfo: STATUS_LABELS.pending,
    action: 'Complaint submitted',
    details: complaint.title,
    isStart: true
  });

  // Add history events
  history.forEach((item, index) => {
    const prevStatus = index > 0 ? history[index - 1].status : 'pending';
    const statusChanged = item.status !== prevStatus;

    timeline.push({
      date: item.createdAt,
      formattedDate: formatDate(item.createdAt),
      type: statusChanged ? 'status_change' : 'update',
      status: item.status,
      statusInfo: STATUS_LABELS[item.status] || STATUS_LABELS.pending,
      action: statusChanged
        ? `Status changed to ${STATUS_LABELS[item.status]?.label || item.status}`
        : extractActionType(item.remarks),
      details: summarizeRemarks(item.remarks),
      adminId: item.adminId,
      isStatusChange: statusChanged
    });
  });

  // Mark last item
  if (timeline.length > 0) {
    timeline[timeline.length - 1].isLatest = true;
  }

  return timeline;
};

/**
 * Extract key actions from history
 */
const extractKeyActions = (history) => {
  const keyActions = [];
  const seenTypes = new Set();

  // Prioritize status changes and unique action types
  history.forEach(item => {
    const actionType = extractActionType(item.remarks);

    // Always include status changes
    if (item.status === 'in_progress' && !seenTypes.has('started')) {
      keyActions.push({
        type: 'started',
        label: 'Processing Started',
        date: item.createdAt,
        formattedDate: formatDate(item.createdAt)
      });
      seenTypes.add('started');
    }

    if (item.status === 'resolved' && !seenTypes.has('resolved')) {
      keyActions.push({
        type: 'resolved',
        label: 'Issue Resolved',
        date: item.createdAt,
        formattedDate: formatDate(item.createdAt)
      });
      seenTypes.add('resolved');
    }

    // Add unique action types
    if (!seenTypes.has(actionType) && actionType !== 'update') {
      keyActions.push({
        type: actionType,
        label: actionType.charAt(0).toUpperCase() + actionType.slice(1),
        date: item.createdAt,
        formattedDate: formatDate(item.createdAt),
        details: summarizeRemarks(item.remarks, 50)
      });
      seenTypes.add(actionType);
    }
  });

  // Sort by date
  keyActions.sort((a, b) => new Date(a.date) - new Date(b.date));

  return keyActions;
};

/**
 * Generate current status summary
 */
const generateStatusSummary = (complaint, history) => {
  const currentStatus = complaint.status;
  const statusInfo = STATUS_LABELS[currentStatus] || STATUS_LABELS.pending;

  // Calculate durations
  const totalDuration = calculateDuration(complaint.createdAt,
    currentStatus === 'resolved' ? complaint.resolvedAt : null);

  // Find time in current status
  const lastStatusChange = history
    .filter(h => h.status === currentStatus)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  const timeInStatus = lastStatusChange
    ? calculateDuration(lastStatusChange.createdAt)
    : totalDuration;

  // Get latest update
  const latestUpdate = history.length > 0
    ? history[history.length - 1]
    : null;

  // Build summary
  const summary = {
    status: currentStatus,
    statusLabel: statusInfo.label,
    statusIcon: statusInfo.icon,
    statusColor: statusInfo.color,
    totalDuration,
    timeInStatus,
    updateCount: history.length,
    lastUpdated: latestUpdate?.createdAt || complaint.createdAt,
    lastUpdatedFormatted: formatDate(latestUpdate?.createdAt || complaint.createdAt),
    latestRemarks: latestUpdate?.remarks || null,
    isOverdue: false,
    overdueBy: null
  };

  // Check if overdue (only for non-resolved)
  if (currentStatus !== 'resolved' && currentStatus !== 'rejected') {
    const estimatedDays = complaint.estimatedResolutionDays || 10;
    const daysSinceCreation = Math.floor(
      (new Date() - new Date(complaint.createdAt)) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceCreation > estimatedDays) {
      summary.isOverdue = true;
      summary.overdueBy = `${daysSinceCreation - estimatedDays} days`;
    }
  }

  return summary;
};

/**
 * Generate full text summary
 */
const generateTextSummary = (complaint, history, timeline, keyActions, statusSummary) => {
  const parts = [];

  // Opening
  parts.push(`Complaint "${complaint.title}" was submitted ${formatDate(complaint.createdAt)}.`);

  // Category and priority
  parts.push(`Category: ${complaint.category}. Priority: ${complaint.priority || 'Normal'}.`);

  // Progress
  if (history.length === 0) {
    parts.push('No updates have been recorded yet.');
  } else {
    parts.push(`${history.length} update${history.length > 1 ? 's' : ''} recorded.`);
  }

  // Key actions
  if (keyActions.length > 0) {
    const actionsSummary = keyActions
      .map(a => `${a.label} (${a.formattedDate})`)
      .join(', ');
    parts.push(`Key actions: ${actionsSummary}.`);
  }

  // Current status
  parts.push(`Current status: ${statusSummary.statusLabel}.`);
  parts.push(`Total time: ${statusSummary.totalDuration}.`);

  // Overdue warning
  if (statusSummary.isOverdue) {
    parts.push(`⚠️ This complaint is overdue by ${statusSummary.overdueBy}.`);
  }

  // Latest update
  if (statusSummary.latestRemarks) {
    parts.push(`Latest update: "${summarizeRemarks(statusSummary.latestRemarks, 100)}"`);
  }

  return parts.join(' ');
};

/**
 * Calculate summary version hash
 * Used to determine if summary needs regeneration
 */
const calculateVersionHash = (complaint, history) => {
  const versionData = {
    status: complaint.status,
    historyCount: history.length,
    lastHistoryId: history.length > 0 ? history[history.length - 1]._id : null,
    updatedAt: complaint.updatedAt?.toISOString() || complaint.createdAt?.toISOString()
  };

  // Simple hash
  return Buffer.from(JSON.stringify(versionData)).toString('base64').slice(0, 20);
};

/**
 * Main summarization function
 *
 * @param {string} complaintId - Complaint ID
 * @param {Object} options - Summarization options
 * @returns {Object} Complete summary with timeline, actions, and status
 */
const summarizeComplaint = async (complaintId, options = {}) => {
  const startTime = Date.now();

  const {
    includeTimeline = true,
    includeKeyActions = true,
    includeTextSummary = true,
    forceRegenerate = false
  } = options;

  const result = {
    complaintId,
    generated: true,
    fromCache: false,
    versionHash: null,
    latencyMs: 0,
    complaint: null,
    timeline: null,
    keyActions: null,
    statusSummary: null,
    textSummary: null,
    error: null
  };

  try {
    // Import models
    const { Complaint, ComplaintHistory } = require('../models');

    // Get complaint
    const complaint = await Complaint.findById(complaintId).lean();
    if (!complaint) {
      result.error = 'Complaint not found';
      result.latencyMs = Date.now() - startTime;
      return result;
    }

    // Get history
    const history = await ComplaintHistory.find({ complaintId })
      .sort({ createdAt: 1 })
      .limit(CONFIG.maxHistoryItems)
      .lean();

    // Calculate version hash
    result.versionHash = calculateVersionHash(complaint, history);

    // Check cache (unless force regenerate)
    if (!forceRegenerate) {
      const summaryCache = cache.getCache('summaries');
      const cacheKey = `${CONFIG.cachePrefix}${complaintId}`;
      const cached = await summaryCache.get(cacheKey);

      if (cached && cached.versionHash === result.versionHash) {
        return {
          ...cached,
          fromCache: true,
          latencyMs: Date.now() - startTime
        };
      }
    }

    // Store basic complaint info
    result.complaint = {
      id: complaint._id,
      trackingId: complaint.trackingId,
      title: complaint.title,
      category: complaint.category,
      priority: complaint.priority,
      status: complaint.status,
      location: complaint.location,
      createdAt: complaint.createdAt,
      resolvedAt: complaint.resolvedAt
    };

    // Generate timeline
    if (includeTimeline) {
      result.timeline = buildTimeline(complaint, history);
    }

    // Extract key actions
    if (includeKeyActions) {
      result.keyActions = extractKeyActions(history);
    }

    // Generate status summary
    result.statusSummary = generateStatusSummary(complaint, history);

    // Generate text summary
    if (includeTextSummary) {
      result.textSummary = generateTextSummary(
        complaint,
        history,
        result.timeline,
        result.keyActions,
        result.statusSummary
      );
    }

    result.latencyMs = Date.now() - startTime;

    // Cache result
    const summaryCache = cache.getCache('summaries');
    const cacheKey = `${CONFIG.cachePrefix}${complaintId}`;
    await summaryCache.set(cacheKey, result, { l1TtlMs: CONFIG.cacheTtlMs });

  } catch (error) {
    result.error = error.message;
    result.generated = false;
    result.latencyMs = Date.now() - startTime;
  }

  return result;
};

/**
 * Summarize multiple complaints (batch)
 */
const summarizeMultiple = async (complaintIds, options = {}) => {
  const results = await Promise.all(
    complaintIds.map(id => summarizeComplaint(id, options))
  );

  return {
    total: complaintIds.length,
    successful: results.filter(r => r.generated).length,
    fromCache: results.filter(r => r.fromCache).length,
    summaries: results,
    avgLatencyMs: Math.round(
      results.reduce((sum, r) => sum + r.latencyMs, 0) / results.length
    )
  };
};

/**
 * Invalidate cached summary for a complaint
 */
const invalidateSummary = async (complaintId) => {
  const summaryCache = cache.getCache('summaries');
  const cacheKey = `${CONFIG.cachePrefix}${complaintId}`;
  await summaryCache.delete(cacheKey);
  return { success: true, complaintId };
};

/**
 * Get summarization statistics
 */
const getSummarizationStats = async () => {
  const summaryCache = cache.getCache('summaries');

  return {
    cache: await summaryCache.getStats(),
    config: {
      maxHistoryItems: CONFIG.maxHistoryItems,
      maxSummaryLength: CONFIG.maxSummaryLength,
      cacheTtlMs: CONFIG.cacheTtlMs
    },
    statusLabels: STATUS_LABELS,
    actionTypes: Object.keys(ACTION_KEYWORDS)
  };
};

module.exports = {
  summarizeComplaint,
  summarizeMultiple,
  buildTimeline,
  extractKeyActions,
  generateStatusSummary,
  generateTextSummary,
  invalidateSummary,
  getSummarizationStats,
  // Export for testing
  CONFIG,
  STATUS_LABELS,
  ACTION_KEYWORDS,
  formatDate,
  calculateDuration
};

