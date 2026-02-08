/**
 * DuplicateWarning Component
 *
 * Displays warning when similar complaints are detected.
 * Non-blocking - user can always proceed.
 *
 * Rules:
 * - Never block submission
 * - Collapsible by default (shows count only)
 * - Clear "Continue Anyway" option
 * - Graceful error handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { FiAlertTriangle, FiChevronDown, FiChevronUp, FiClock, FiExternalLink } from 'react-icons/fi';
import { complaintService } from '../../services/complaint.service';
import { useTranslation } from '../../context/TranslationContext';
import TranslatedText from '../TranslatedText';

// Status badge styles
const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700'
};

const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected'
};

const DuplicateWarning = ({
  title = '',
  description = '',
  category = 'Other',
  onDismiss,
  visible = true,
  debounceMs = 500,
  minLength = 30
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const lastCheckedRef = useRef('');

  // Check if we should show the component
  const shouldCheck = visible && !dismissed && description.length >= minLength;

  // Fetch duplicates
  const checkDuplicates = useCallback(async () => {
    const text = `${title} ${description}`.trim();

    // Don't re-check same content
    if (text === lastCheckedRef.current) return;
    lastCheckedRef.current = text;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setLoading(true);

    try {
      const response = await complaintService.checkDuplicates({
        title,
        description,
        category
      });

      if (response.success) {
        setResult(response);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Duplicate check failed (non-fatal):', err.message);
        setResult(null);
      }
    } finally {
      setLoading(false);
    }
  }, [title, description, category]);

  // Debounced check
  useEffect(() => {
    if (!shouldCheck) return;

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      checkDuplicates();
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [shouldCheck, checkDuplicates, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle dismiss
  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  // Don't render if dismissed or no duplicates
  if (dismissed) return null;
  if (!shouldCheck) return null;
  if (!loading && (!result || !result.hasDuplicates)) return null;

  const duplicates = result?.duplicates || [];
  const count = duplicates.length;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getSimilarityLabel = (similarity) => {
    const pct = typeof similarity === 'number'
      ? Math.round(similarity * 100)
      : parseInt(similarity);
    return `${pct}%`;
  };

  return (
    <div
      className="bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden"
      role="alert"
      aria-live="polite"
    >
      {/* Header - Always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-yellow-100/50 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center space-x-2">
          <FiAlertTriangle className="text-yellow-600" size={18} />
          <span className="text-sm font-medium text-yellow-800">
            {loading ? (
              <TranslatedText text="Checking for similar complaints..." />
            ) : (
              <>
                <TranslatedText text="Similar complaints found" /> ({count})
              </>
            )}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {!loading && (
            <span className="text-xs text-yellow-600 hidden sm:inline">
              <TranslatedText text="Click to view" />
            </span>
          )}
          {isExpanded ? (
            <FiChevronUp className="text-yellow-600" size={18} />
          ) : (
            <FiChevronDown className="text-yellow-600" size={18} />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && !loading && (
        <div className="px-3 pb-3 space-y-3">
          {/* Duplicate List */}
          <div className="space-y-2">
            {duplicates.slice(0, 5).map((dup, idx) => (
              <div
                key={idx}
                className="bg-white border border-yellow-100 rounded-lg p-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {dup.title}
                    </p>
                    <div className="flex items-center flex-wrap gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[dup.status] || STATUS_STYLES.pending}`}>
                        <TranslatedText text={STATUS_LABELS[dup.status] || dup.status} />
                      </span>
                      <span className="text-xs text-gray-500 flex items-center space-x-1">
                        <FiClock size={10} />
                        <span>{formatDate(dup.createdAt)}</span>
                      </span>
                      {dup.trackingId && (
                        <span className="text-xs font-mono text-gray-400">
                          {dup.trackingId}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                      {getSimilarityLabel(dup.similarity)} <TranslatedText text="similar" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Confidence Band Info */}
          {result?.confidenceBand && (
            <p className="text-xs text-yellow-600 flex items-center space-x-1">
              <FiAlertTriangle size={12} />
              <span>
                {result.confidenceBand === 'high' && (
                  <TranslatedText text="High similarity detected. Your complaint may already be reported." />
                )}
                {result.confidenceBand === 'medium' && (
                  <TranslatedText text="Some similar complaints found. Please review before submitting." />
                )}
                {result.confidenceBand === 'low' && (
                  <TranslatedText text="Minor similarities found. You may proceed with submission." />
                )}
              </span>
            </p>
          )}

          {/* Continue Anyway Button */}
          <div className="pt-2 border-t border-yellow-200">
            <button
              type="button"
              onClick={handleDismiss}
              className="text-sm text-yellow-700 hover:text-yellow-800 font-medium transition-colors"
            >
              <TranslatedText text="Continue Anyway →" />
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isExpanded && loading && (
        <div className="px-3 pb-3">
          <div className="animate-pulse space-y-2">
            <div className="h-12 bg-yellow-100 rounded"></div>
            <div className="h-12 bg-yellow-100 rounded"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DuplicateWarning;

