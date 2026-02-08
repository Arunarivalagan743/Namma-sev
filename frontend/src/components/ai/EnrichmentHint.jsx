/**
 * EnrichmentHint Component
 *
 * Displays AI-powered suggestions to improve complaint quality.
 * Non-intrusive, appears as a subtle icon in the textarea.
 *
 * Rules:
 * - Never auto-edit user content
 * - Always show suggestions, never force
 * - Non-blocking, async processing
 * - Graceful error handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { FiZap, FiX, FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { complaintService } from '../../services/complaint.service';
import { useTranslation } from '../../context/TranslationContext';
import TranslatedText from '../TranslatedText';

const EnrichmentHint = ({
  title = '',
  description = '',
  category = 'Other',
  minLength = 20,
  debounceMs = 300
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enrichment, setEnrichment] = useState(null);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Show hint only when description has minimum length
  const showHint = description.length >= minLength;

  // Fetch enrichment suggestions
  const fetchEnrichment = useCallback(async () => {
    if (!showHint) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const result = await complaintService.previewEnrichment({
        title,
        description,
        category
      });

      if (result.success && result.enrichment) {
        setEnrichment(result.enrichment);
      } else {
        setEnrichment(null);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Enrichment fetch failed (non-fatal):', err.message);
        setError('Unable to load suggestions');
      }
    } finally {
      setLoading(false);
    }
  }, [title, description, category, showHint]);

  // Debounced fetch when user opens panel
  useEffect(() => {
    if (isOpen && showHint) {
      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        fetchEnrichment();
      }, debounceMs);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [isOpen, showHint, fetchEnrichment, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Don't render if description too short
  if (!showHint) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="relative">
      {/* Hint Button - positioned inside textarea area */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`absolute right-2 bottom-2 p-1.5 rounded-lg transition-all duration-200
          ${isOpen
            ? 'bg-gov-blue text-white shadow-md'
            : 'bg-gov-blue/10 text-gov-blue hover:bg-gov-blue/20'
          }`}
        aria-label="Get AI suggestions to improve your complaint"
        aria-expanded={isOpen}
        title="AI suggestions"
      >
        <FiZap size={16} />
      </button>

      {/* Suggestion Panel - Inline, not modal */}
      {isOpen && (
        <div
          className="mt-2 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
          role="region"
          aria-label="AI Suggestions Panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-gov-blue/5 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <FiZap className="text-gov-blue" size={16} />
              <span className="text-sm font-medium text-gov-blue">
                <TranslatedText text="AI Suggestions" />
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              aria-label="Close suggestions"
            >
              <FiX size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-3">
            {loading ? (
              // Skeleton loader
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ) : error ? (
              // Error state - silent, non-blocking
              <div className="flex items-center space-x-2 text-gray-500 text-sm">
                <FiInfo size={14} />
                <span><TranslatedText text="Suggestions unavailable" /></span>
              </div>
            ) : enrichment ? (
              <div className="space-y-3">
                {/* Completeness Score */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    <TranslatedText text="Completeness" />
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          enrichment.completenessScore >= 80 ? 'bg-green-500' :
                          enrichment.completenessScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${enrichment.completenessScore}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getScoreColor(enrichment.completenessScore)}`}>
                      {enrichment.completenessScore}%
                    </span>
                  </div>
                </div>

                {/* Missing Context */}
                {enrichment.missingContext?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">
                      <TranslatedText text="Missing Information" />
                    </p>
                    <ul className="space-y-1.5">
                      {enrichment.missingContext.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="flex items-start space-x-2 text-sm">
                          <FiAlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" size={14} />
                          <span className="text-gray-700">
                            <TranslatedText text={item.prompt} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Quality Issues */}
                {enrichment.qualityIssues?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">
                      <TranslatedText text="Suggestions" />
                    </p>
                    <ul className="space-y-1.5">
                      {enrichment.qualityIssues.slice(0, 2).map((issue, idx) => (
                        <li key={idx} className="flex items-start space-x-2 text-sm">
                          <FiInfo className="text-gov-blue flex-shrink-0 mt-0.5" size={14} />
                          <span className="text-gray-700">
                            <TranslatedText text={issue.message} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* All Good Message */}
                {enrichment.completenessScore >= 80 &&
                 (!enrichment.missingContext?.length) &&
                 (!enrichment.qualityIssues?.length) && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <FiCheckCircle size={16} />
                    <span className="text-sm font-medium">
                      <TranslatedText text="Your complaint looks complete!" />
                    </span>
                  </div>
                )}

                {/* Performance indicator */}
                {enrichment.latencyMs && (
                  <p className="text-[10px] text-gray-400 text-right">
                    Analyzed in {enrichment.latencyMs}ms
                  </p>
                )}
              </div>
            ) : (
              // Initial state
              <p className="text-sm text-gray-500">
                <TranslatedText text="Click to analyze your complaint" />
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full text-sm text-gray-600 hover:text-gov-blue transition-colors py-1"
            >
              <TranslatedText text="Got it!" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrichmentHint;

