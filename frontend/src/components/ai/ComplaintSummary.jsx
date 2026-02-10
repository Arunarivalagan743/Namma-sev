/**
 * ComplaintSummary Component
 *
 * Displays AI-generated summary of complaint for admins.
 * Shows timeline, key actions, and status overview.
 *
 * Rules:
 * - Cached responses honored
 * - Manual refresh available
 * - Collapsible header
 * - Print-friendly styles
 * - Graceful error handling
 */

import { useState, useEffect, useCallback } from 'react';
import {
  FiFileText, FiChevronDown, FiChevronUp, FiRefreshCw,
  FiClock, FiCheckCircle, FiAlertCircle, FiActivity,
  FiCalendar, FiMessageSquare
} from 'react-icons/fi';
import { adminService } from '../../services/admin.service';
import { useTranslation } from '../../context/TranslationContext';
import TranslatedText from '../TranslatedText';

// Status icon mapping
const STATUS_ICONS = {
  pending: FiClock,
  in_progress: FiActivity,
  resolved: FiCheckCircle,
  rejected: FiAlertCircle
};

const STATUS_COLORS = {
  pending: 'text-yellow-600 bg-yellow-50',
  in_progress: 'text-blue-600 bg-blue-50',
  resolved: 'text-green-600 bg-green-50',
  rejected: 'text-red-600 bg-red-50'
};

const ComplaintSummary = ({
  complaintId,
  autoLoad = true,
  collapsible = true,
  defaultExpanded = true,
  printFriendly = false,
  className = ''
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  // Fetch summary
  const fetchSummary = useCallback(async (forceRefresh = false) => {
    if (!complaintId) return;

    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await adminService.getComplaintSummary(
        complaintId,
        forceRefresh ? { forceRegenerate: true } : undefined
      );

      const summaryPayload = response?.summary || response?.data;

      if (response?.success && summaryPayload) {
        setSummary(summaryPayload);
      } else {
        setError(response?.message || 'Summary not available');
      }
    } catch (err) {
      console.warn('Summary fetch failed:', err.message);
      setError('Unable to load summary');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [complaintId]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && complaintId) {
      fetchSummary();
    }
  }, [autoLoad, complaintId, fetchSummary]);

  // Handle refresh
  const handleRefresh = (e) => {
    e.stopPropagation();
    fetchSummary(true);
  };

  // Toggle expanded state
  const toggleExpanded = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  // Get status icon component
  const StatusIcon = summary?.statusSummary?.status
    ? STATUS_ICONS[summary.statusSummary.status] || FiClock
    : FiClock;

  const statusColor = summary?.statusSummary?.status
    ? STATUS_COLORS[summary.statusSummary.status] || STATUS_COLORS.pending
    : STATUS_COLORS.pending;

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${
        printFriendly ? 'print:shadow-none print:border-black' : ''
      } ${className}`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-3 py-2.5 bg-gov-blue/5 border-b border-gray-200 ${
          collapsible ? 'cursor-pointer hover:bg-gov-blue/10' : ''
        }`}
        onClick={toggleExpanded}
        role={collapsible ? 'button' : undefined}
        aria-expanded={collapsible ? isExpanded : undefined}
      >
        <div className="flex items-center space-x-2">
          <FiFileText className="text-gov-blue" size={16} />
          <span className="text-sm font-medium text-gov-blue">
            <TranslatedText text="AI Summary" />
          </span>
          {summary?.fromCache && (
            <span className="text-[10px] text-gray-400 px-1.5 py-0.5 bg-gray-100 rounded">
              cached
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1 rounded hover:bg-white transition-colors disabled:opacity-50"
            aria-label="Refresh summary"
            title="Refresh"
          >
            <FiRefreshCw
              size={14}
              className={`text-gray-500 ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>
          {/* Collapse Toggle */}
          {collapsible && (
            isExpanded ? (
              <FiChevronUp size={16} className="text-gray-500" />
            ) : (
              <FiChevronDown size={16} className="text-gray-500" />
            )
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-3">
          {loading ? (
            // Skeleton loader
            <div className="animate-pulse space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : error ? (
            // Error state
            <div className="text-center py-4 text-gray-500">
              <FiAlertCircle className="mx-auto mb-2" size={24} />
              <p className="text-sm">{error}</p>
              <button
                type="button"
                onClick={handleRefresh}
                className="mt-2 text-xs text-gov-blue hover:underline"
              >
                <TranslatedText text="Try again" />
              </button>
            </div>
          ) : summary ? (
            <div className="space-y-4">
              {/* Status Overview */}
              <div className={`flex items-center space-x-3 p-3 rounded-lg ${statusColor}`}>
                <StatusIcon size={24} />
                <div>
                  <p className="font-medium">
                    {summary.statusSummary?.statusLabel || summary.statusSummary?.status || 'Unknown'}
                  </p>
                  <p className="text-sm opacity-80">
                    <TranslatedText text="Total time" />: {summary.statusSummary?.totalDuration || 'N/A'}
                  </p>
                </div>
                {/* Overdue Warning */}
                {summary.statusSummary?.isOverdue && (
                  <div className="ml-auto flex items-center space-x-1 bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
                    <FiAlertCircle size={12} />
                    <span><TranslatedText text="Overdue by" /> {summary.statusSummary.overdueBy}</span>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-lg font-semibold text-gov-blue">
                    {summary.statusSummary?.updateCount || 0}
                  </p>
                  <p className="text-xs text-gray-500"><TranslatedText text="Updates" /></p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-lg font-semibold text-gov-blue">
                    {summary.keyActions?.length || 0}
                  </p>
                  <p className="text-xs text-gray-500"><TranslatedText text="Key Actions" /></p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-lg font-semibold text-gov-blue">
                    {summary.timeline?.length || 0}
                  </p>
                  <p className="text-xs text-gray-500"><TranslatedText text="Events" /></p>
                </div>
              </div>

              {/* Timeline */}
              {summary.timeline && summary.timeline.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 flex items-center space-x-1">
                    <FiCalendar size={12} />
                    <span><TranslatedText text="Timeline" /></span>
                  </p>
                  <div className="relative pl-4 border-l-2 border-gray-200 space-y-3">
                    {summary.timeline.slice(0, 5).map((event, idx) => (
                      <div key={idx} className="relative">
                        {/* Timeline dot */}
                        <div className={`absolute -left-[21px] w-3 h-3 rounded-full border-2 border-white ${
                          event.isLatest ? 'bg-gov-blue' :
                          event.isStatusChange ? 'bg-yellow-400' : 'bg-gray-300'
                        }`}></div>

                        <div className="text-sm">
                          <p className="font-medium text-gray-800">
                            {event.action || event.statusInfo?.label || event.type}
                          </p>
                          {event.details && (
                            <p className="text-gray-600 text-xs mt-0.5 line-clamp-2">
                              {event.details}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">
                            {event.formattedDate}
                          </p>
                        </div>
                      </div>
                    ))}
                    {summary.timeline.length > 5 && (
                      <p className="text-xs text-gray-400 pl-2">
                        +{summary.timeline.length - 5} <TranslatedText text="more events" />
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Key Actions */}
              {summary.keyActions && summary.keyActions.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 flex items-center space-x-1">
                    <FiActivity size={12} />
                    <span><TranslatedText text="Key Actions" /></span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {summary.keyActions.map((action, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gov-blue/10 text-gov-blue px-2 py-1 rounded-full"
                      >
                        {action.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Text Summary */}
              {summary.textSummary && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center space-x-1">
                    <FiMessageSquare size={12} />
                    <span><TranslatedText text="Summary" /></span>
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {summary.textSummary}
                  </p>
                </div>
              )}

              {/* Last Updated */}
              {summary.statusSummary?.lastUpdatedFormatted && (
                <p className="text-[10px] text-gray-400 text-right">
                  <TranslatedText text="Last updated" />: {summary.statusSummary.lastUpdatedFormatted}
                </p>
              )}

              {/* Performance indicator */}
              {summary.latencyMs && (
                <p className="text-[10px] text-gray-400 text-right">
                  Generated in {summary.latencyMs}ms
                </p>
              )}
            </div>
          ) : (
            // No data state
            <div className="text-center py-4 text-gray-500">
              <FiFileText className="mx-auto mb-2" size={24} />
              <p className="text-sm"><TranslatedText text="No summary available" /></p>
            </div>
          )}
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          .animate-pulse { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ComplaintSummary;

