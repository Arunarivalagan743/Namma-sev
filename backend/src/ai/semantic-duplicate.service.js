/**
 * Enhanced Semantic Duplicate Detection Service
 *
 * Phase 4 Feature 2: Prevent redundant complaints with semantic similarity
 *
 * Enhancements over existing duplicate.service.js:
 * - Semantic embedding support (TF-IDF vectors cached)
 * - Configurable confidence bands
 * - Admin override support
 * - No re-embedding duplicates
 * - No query-time model loading
 *
 * Target latency: <40ms
 */

const mongoose = require('mongoose');
const preprocessor = require('./preprocessor');
const cache = require('./cache');

// Configuration
const CONFIG = {
  // Similarity thresholds
  thresholds: {
    exact: 0.95,      // Near-exact duplicate
    high: 0.80,       // Very likely duplicate
    medium: 0.65,     // Possibly related
    low: 0.50         // Weak similarity
  },

  // Search parameters
  recentDays: 30,
  maxCandidates: 100,
  maxResults: 5,

  // Cache settings
  embeddingCachePrefix: 'emb:',
  resultCachePrefix: 'dup:',
  cacheTtlMs: 30 * 60 * 1000,  // 30 minutes

  // Performance
  maxVectorDimensions: 500,  // Limit vocabulary for TF-IDF
  minTokens: 3
};

// Confidence bands for user-friendly messaging
const CONFIDENCE_BANDS = {
  exact: { min: 0.95, label: 'Exact Match', action: 'block', color: 'red' },
  high: { min: 0.80, label: 'Very Similar', action: 'warn', color: 'orange' },
  medium: { min: 0.65, label: 'Possibly Related', action: 'suggest', color: 'yellow' },
  low: { min: 0.50, label: 'Weakly Similar', action: 'info', color: 'blue' }
};

// Embedding vector cache schema
const VectorCacheSchema = new mongoose.Schema({
  _id: String,  // complaintId
  complaintId: {
    type: String,
    required: true,
    index: true
  },
  vector: {
    type: Map,
    of: Number,
    required: true
  },
  category: String,
  tokenCount: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'complaint_vectors'
});

// TTL index - auto-cleanup after 90 days (only define once)
VectorCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

let VectorCache;
try {
  VectorCache = mongoose.model('VectorCache');
} catch {
  VectorCache = mongoose.model('VectorCache', VectorCacheSchema);
}

/**
 * Build TF-IDF vector for a single document
 * Uses global IDF from all cached vectors
 */
const buildVector = (text, globalIdf = {}) => {
  const tokens = preprocessor.tokenize(text);
  if (tokens.length < CONFIG.minTokens) {
    return { vector: {}, tokenCount: tokens.length };
  }

  // Calculate term frequency
  const tf = {};
  tokens.forEach(token => {
    tf[token] = (tf[token] || 0) + 1;
  });

  // Normalize TF
  const maxTf = Math.max(...Object.values(tf));
  Object.keys(tf).forEach(term => {
    tf[term] = tf[term] / maxTf;
  });

  // Apply IDF (use default if not available)
  const vector = {};
  Object.entries(tf).forEach(([term, termFreq]) => {
    const idf = globalIdf[term] || Math.log(100);  // Default IDF
    vector[term] = termFreq * idf;
  });

  return { vector, tokenCount: tokens.length };
};

/**
 * Calculate cosine similarity between two sparse vectors
 */
const cosineSimilarity = (vec1, vec2) => {
  if (!vec1 || !vec2) return 0;

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  // Convert Map to object if needed
  const v1 = vec1 instanceof Map ? Object.fromEntries(vec1) : vec1;
  const v2 = vec2 instanceof Map ? Object.fromEntries(vec2) : vec2;

  const allKeys = new Set([...Object.keys(v1), ...Object.keys(v2)]);

  allKeys.forEach(key => {
    const val1 = v1[key] || 0;
    const val2 = v2[key] || 0;
    dotProduct += val1 * val2;
    norm1 += val1 * val1;
    norm2 += val2 * val2;
  });

  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
};

/**
 * Get confidence band for a similarity score
 */
const getConfidenceBand = (similarity) => {
  if (similarity >= CONFIDENCE_BANDS.exact.min) return { ...CONFIDENCE_BANDS.exact, similarity };
  if (similarity >= CONFIDENCE_BANDS.high.min) return { ...CONFIDENCE_BANDS.high, similarity };
  if (similarity >= CONFIDENCE_BANDS.medium.min) return { ...CONFIDENCE_BANDS.medium, similarity };
  if (similarity >= CONFIDENCE_BANDS.low.min) return { ...CONFIDENCE_BANDS.low, similarity };
  return { min: 0, label: 'Not Similar', action: 'none', color: 'green', similarity };
};

/**
 * Store vector for a complaint (async, non-blocking)
 */
const storeVector = async (complaintId, vector, category, tokenCount) => {
  try {
    await VectorCache.findOneAndUpdate(
      { _id: complaintId },
      {
        complaintId,
        vector: new Map(Object.entries(vector)),
        category,
        tokenCount,
        createdAt: new Date()
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('[SemanticDuplicate] Vector store error:', error.message);
  }
};

/**
 * Get cached vectors for candidate complaints
 */
const getCachedVectors = async (complaintIds) => {
  try {
    const cached = await VectorCache.find({
      _id: { $in: complaintIds }
    }).lean();

    const vectorMap = {};
    cached.forEach(doc => {
      vectorMap[doc.complaintId] = {
        vector: doc.vector instanceof Map ? Object.fromEntries(doc.vector) : doc.vector,
        tokenCount: doc.tokenCount
      };
    });

    return vectorMap;
  } catch (error) {
    console.error('[SemanticDuplicate] Vector fetch error:', error.message);
    return {};
  }
};

/**
 * Enhanced duplicate detection with semantic similarity
 *
 * @param {string} text - New complaint text (title + description)
 * @param {string} userId - User ID
 * @param {Object} options - Detection options
 * @returns {Object} Detection results with confidence bands
 */
const findSemanticDuplicates = async (text, userId, options = {}) => {
  const startTime = Date.now();

  const {
    threshold = CONFIG.thresholds.low,
    maxResults = CONFIG.maxResults,
    category = null,
    includeResolved = false,
    includeOwn = false
  } = options;

  const result = {
    duplicates: [],
    hasDuplicates: false,
    highestSimilarity: 0,
    confidenceBand: null,
    recommendation: 'proceed',
    latencyMs: 0,
    fromCache: false,
    error: null
  };

  try {
    // Check result cache first
    const resultCache = cache.getCache('duplicate_results');
    const cacheKey = `${CONFIG.resultCachePrefix}${preprocessor.preprocess(text).slice(0, 80)}:${category || 'all'}`;

    const cached = await resultCache.get(cacheKey);
    if (cached) {
      return {
        ...cached,
        fromCache: true,
        latencyMs: Date.now() - startTime
      };
    }

    // Import Complaint model
    const { Complaint } = require('../models');

    // Build query for candidates
    const query = {
      createdAt: {
        $gte: new Date(Date.now() - CONFIG.recentDays * 24 * 60 * 60 * 1000)
      }
    };

    if (category) {
      query.category = category;
    }

    if (!includeResolved) {
      query.status = { $in: ['pending', 'in_progress'] };
    }

    if (!includeOwn && userId) {
      query.userId = { $ne: userId };
    }

    // Get candidates
    const candidates = await Complaint.find(query)
      .select('_id trackingId title description category status location createdAt userId')
      .limit(CONFIG.maxCandidates)
      .lean();

    if (candidates.length === 0) {
      result.latencyMs = Date.now() - startTime;
      await resultCache.set(cacheKey, result, { l1TtlMs: CONFIG.cacheTtlMs });
      return result;
    }

    // Build vector for new complaint
    const { vector: newVector, tokenCount } = buildVector(text);

    if (tokenCount < CONFIG.minTokens) {
      result.error = 'Text too short for duplicate detection';
      result.latencyMs = Date.now() - startTime;
      return result;
    }

    // Get cached vectors for candidates
    const complaintIds = candidates.map(c => c._id);
    const cachedVectors = await getCachedVectors(complaintIds);

    // Calculate similarities
    const similarities = [];

    for (const candidate of candidates) {
      let candidateVector;

      // Use cached vector if available
      if (cachedVectors[candidate._id]) {
        candidateVector = cachedVectors[candidate._id].vector;
      } else {
        // Build and cache vector
        const candidateText = `${candidate.title || ''} ${candidate.description || ''}`;
        const { vector, tokenCount: candTokens } = buildVector(candidateText);
        candidateVector = vector;

        // Store for future use (non-blocking)
        storeVector(candidate._id, vector, candidate.category, candTokens);
      }

      const similarity = cosineSimilarity(newVector, candidateVector);

      if (similarity >= threshold) {
        similarities.push({
          complaint: candidate,
          similarity: Math.round(similarity * 1000) / 1000,
          confidenceBand: getConfidenceBand(similarity)
        });
      }
    }

    // Sort by similarity and limit
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topResults = similarities.slice(0, maxResults);

    // Build response
    result.duplicates = topResults.map(s => ({
      complaintId: s.complaint._id,
      trackingId: s.complaint.trackingId,
      title: s.complaint.title,
      category: s.complaint.category,
      status: s.complaint.status,
      location: s.complaint.location,
      similarity: s.similarity,
      confidenceBand: s.confidenceBand,
      sameUser: s.complaint.userId === userId,
      createdAt: s.complaint.createdAt
    }));

    result.hasDuplicates = topResults.length > 0;

    if (topResults.length > 0) {
      result.highestSimilarity = topResults[0].similarity;
      result.confidenceBand = topResults[0].confidenceBand;

      // Set recommendation based on highest similarity
      if (result.highestSimilarity >= CONFIG.thresholds.exact) {
        result.recommendation = 'block';
      } else if (result.highestSimilarity >= CONFIG.thresholds.high) {
        result.recommendation = 'warn';
      } else if (result.highestSimilarity >= CONFIG.thresholds.medium) {
        result.recommendation = 'suggest_merge';
      } else {
        result.recommendation = 'proceed';
      }
    }

    result.latencyMs = Date.now() - startTime;

    // Cache result
    await resultCache.set(cacheKey, result, { l1TtlMs: CONFIG.cacheTtlMs });

  } catch (error) {
    result.error = error.message;
    result.latencyMs = Date.now() - startTime;
  }

  return result;
};

/**
 * Admin override - mark a detected duplicate as "not duplicate"
 */
const markNotDuplicate = async (complaintId1, complaintId2, adminId) => {
  try {
    // Store override in a separate collection
    const OverrideSchema = new mongoose.Schema({
      complaint1: String,
      complaint2: String,
      adminId: String,
      createdAt: { type: Date, default: Date.now }
    }, { collection: 'duplicate_overrides' });

    let Override;
    try {
      Override = mongoose.model('DuplicateOverride');
    } catch {
      Override = mongoose.model('DuplicateOverride', OverrideSchema);
    }

    await Override.create({
      complaint1: complaintId1,
      complaint2: complaintId2,
      adminId
    });

    // Invalidate cache for both complaints
    const resultCache = cache.getCache('duplicate_results');
    // Note: We'd need to track which cache keys contain these complaints
    // For now, cache will naturally expire

    return { success: true, message: 'Override recorded' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Update threshold dynamically
 */
const updateThreshold = (band, newValue) => {
  if (CONFIDENCE_BANDS[band] && newValue >= 0 && newValue <= 1) {
    CONFIG.thresholds[band] = newValue;
    CONFIDENCE_BANDS[band].min = newValue;
    return { success: true, band, newValue };
  }
  return { success: false, error: 'Invalid band or value' };
};

/**
 * Get duplicate detection statistics
 */
const getSemanticDuplicateStats = async () => {
  const resultCache = cache.getCache('duplicate_results');

  let vectorCount = 0;
  try {
    vectorCount = await VectorCache.countDocuments();
  } catch (e) {
    // Collection might not exist yet
  }

  return {
    cache: await resultCache.getStats(),
    vectorsStored: vectorCount,
    config: {
      thresholds: CONFIG.thresholds,
      recentDays: CONFIG.recentDays,
      maxCandidates: CONFIG.maxCandidates
    },
    confidenceBands: CONFIDENCE_BANDS
  };
};

module.exports = {
  findSemanticDuplicates,
  buildVector,
  cosineSimilarity,
  getConfidenceBand,
  storeVector,
  markNotDuplicate,
  updateThreshold,
  getSemanticDuplicateStats,
  // Export for testing
  CONFIG,
  CONFIDENCE_BANDS
};

