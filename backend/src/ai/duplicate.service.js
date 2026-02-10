/**
 * Duplicate Detection Service
 *
 * Detects similar complaints to avoid redundant processing.
 * Uses:
 * 1. Jaccard similarity for quick screening
 * 2. TF-IDF cosine similarity for better accuracy
 * 3. (Optional) Embedding-based similarity for highest accuracy
 */

const mongoose = require('mongoose');
const preprocessor = require('./preprocessor');

// Configuration
const SIMILARITY_THRESHOLD = 0.6;  // Minimum similarity to be considered duplicate
const RECENT_DAYS = 30;            // Only check complaints from last N days
const MAX_CANDIDATES = 100;        // Maximum complaints to compare against

// Embedding cache schema (for future use with ONNX models)
const EmbeddingCacheSchema = new mongoose.Schema({
  _id: String,  // complaintId
  complaintId: {
    type: String,
    required: true,
    index: true
  },
  embedding: {
    type: [Number],  // 384-dimensional vector
    required: true
  },
  category: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'complaint_embeddings'
});

// TTL index to auto-cleanup old embeddings (only define once)
EmbeddingCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90 days

const EmbeddingCache = mongoose.model('EmbeddingCache', EmbeddingCacheSchema);

/**
 * Build TF-IDF vectors for text comparison
 * Simple implementation without external libraries
 */
const buildTFIDF = (documents) => {
  const termDocFreq = {};  // How many documents contain each term
  const docTermFreq = [];  // Term frequency for each document

  // First pass: count term frequencies
  documents.forEach((doc, idx) => {
    const tokens = preprocessor.tokenize(doc);
    const termFreq = {};

    tokens.forEach(token => {
      termFreq[token] = (termFreq[token] || 0) + 1;
    });

    docTermFreq[idx] = termFreq;

    // Count document frequency
    Object.keys(termFreq).forEach(term => {
      termDocFreq[term] = (termDocFreq[term] || 0) + 1;
    });
  });

  // Second pass: calculate TF-IDF
  const numDocs = documents.length;
  const tfidfVectors = docTermFreq.map(termFreq => {
    const vector = {};
    const docLength = Object.values(termFreq).reduce((a, b) => a + b, 0);

    Object.entries(termFreq).forEach(([term, freq]) => {
      const tf = freq / docLength;  // Normalized term frequency
      const idf = Math.log(numDocs / (termDocFreq[term] || 1));
      vector[term] = tf * idf;
    });

    return vector;
  });

  return { vectors: tfidfVectors, terms: Object.keys(termDocFreq) };
};

/**
 * Calculate cosine similarity between two sparse vectors
 */
const cosineSimilarity = (vec1, vec2) => {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  const allKeys = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);

  allKeys.forEach(key => {
    const v1 = vec1[key] || 0;
    const v2 = vec2[key] || 0;
    dotProduct += v1 * v2;
    norm1 += v1 * v1;
    norm2 += v2 * v2;
  });

  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
};

/**
 * Find similar complaints using TF-IDF
 * @param {string} text - New complaint text
 * @param {Array} candidates - Existing complaints to compare against
 * @returns {Array} - Similar complaints with scores
 */
const findSimilarTFIDF = (text, candidates) => {
  if (!candidates || candidates.length === 0) return [];

  // Build TF-IDF for all documents including the new one
  const combineFields = (complaint) => [complaint.title, complaint.description, complaint.location]
    .filter(field => typeof field === 'string' && field.trim().length > 0)
    .join(' ');

  const allTexts = [text, ...candidates.map(c => combineFields(c))];
  const { vectors } = buildTFIDF(allTexts);

  const newVector = vectors[0];
  const similarities = [];

  for (let i = 1; i < vectors.length; i++) {
    const similarity = cosineSimilarity(newVector, vectors[i]);
    if (similarity >= SIMILARITY_THRESHOLD) {
      similarities.push({
        complaint: candidates[i - 1],
        similarity: Math.round(similarity * 100) / 100,
        method: 'tfidf'
      });
    }
  }

  // Sort by similarity descending
  return similarities.sort((a, b) => b.similarity - a.similarity);
};

/**
 * Quick screening using Jaccard similarity
 * Much faster than TF-IDF for initial filtering
 */
const findSimilarJaccard = (text, candidates) => {
  if (!candidates || candidates.length === 0) return [];

  const similarities = [];

  candidates.forEach(candidate => {
    const candidateText = [candidate.title, candidate.description, candidate.location]
      .filter(field => typeof field === 'string' && field.trim().length > 0)
      .join(' ');
    const similarity = preprocessor.jaccardSimilarity(text, candidateText);

    if (similarity >= SIMILARITY_THRESHOLD * 0.8) {  // Lower threshold for screening
      similarities.push({
        complaint: candidate,
        similarity: Math.round(similarity * 100) / 100,
        method: 'jaccard'
      });
    }
  });

  return similarities.sort((a, b) => b.similarity - a.similarity);
};

/**
 * Main duplicate detection function
 * Uses two-stage approach: Jaccard for screening, TF-IDF for confirmation
 */
const findSimilar = async (text, userId, options = {}) => {
  const {
    threshold = SIMILARITY_THRESHOLD,
    maxResults = 5,
    category = null,
    includeResolved = false
  } = options;

  try {
    // Import Complaint model dynamically to avoid circular dependency
    const { Complaint } = require('../models');

    // Build query for candidate complaints
    const query = {
      createdAt: {
        $gte: new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000)
      }
    };

    // Optionally filter by category
    if (category) {
      query.category = category;
    }

    // Optionally exclude resolved complaints
    if (!includeResolved) {
      query.status = { $in: ['pending', 'in_progress'] };
    }

    // Get candidate complaints
    const candidates = await Complaint.find(query)
      .select('_id trackingId title description category status location createdAt userId')
      .limit(MAX_CANDIDATES)
      .lean();

    if (candidates.length === 0) {
      return [];
    }

    // Stage 1: Quick Jaccard screening
    const jaccardMatches = findSimilarJaccard(text, candidates);

    // If no matches from quick screening, return empty
    if (jaccardMatches.length === 0) {
      return [];
    }

    // Stage 2: TF-IDF confirmation on Jaccard matches
    const screened = jaccardMatches.map(m => m.complaint);
    const tfidfMatches = findSimilarTFIDF(text, screened);

    // Filter by final threshold and limit results
    const results = tfidfMatches
      .filter(m => m.similarity >= threshold)
      .slice(0, maxResults)
      .map(m => ({
        complaintId: m.complaint._id,
        trackingId: m.complaint.trackingId,
        title: m.complaint.title,
        category: m.complaint.category,
        status: m.complaint.status,
        location: m.complaint.location,
        similarity: m.similarity,
        sameUser: m.complaint.userId === userId,
        createdAt: m.complaint.createdAt
      }));

    return results;

  } catch (error) {
    console.error('Duplicate detection error:', error.message);
    return [];
  }
};

/**
 * Check if a new complaint is a duplicate
 * Returns boolean for quick checks
 */
const isDuplicate = async (text, userId, options = {}) => {
  const similar = await findSimilar(text, userId, { ...options, maxResults: 1 });
  return similar.length > 0;
};

/**
 * Get duplicate detection statistics
 */
const getDuplicateStats = async () => {
  try {
    const { Complaint } = require('../models');

    // Get complaints from last 30 days
    const recentComplaints = await Complaint.find({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).select('title description category').lean();

    // Sample analysis (check first 50 against each other)
    const sample = recentComplaints.slice(0, 50);
    let potentialDuplicates = 0;

    for (let i = 0; i < sample.length; i++) {
      for (let j = i + 1; j < sample.length; j++) {
        const text1 = `${sample[i].title} ${sample[i].description}`;
        const text2 = `${sample[j].title} ${sample[j].description}`;
        const similarity = preprocessor.jaccardSimilarity(text1, text2);

        if (similarity >= SIMILARITY_THRESHOLD) {
          potentialDuplicates++;
        }
      }
    }

    return {
      totalRecentComplaints: recentComplaints.length,
      sampledComplaints: sample.length,
      potentialDuplicatePairs: potentialDuplicates,
      estimatedDuplicateRate: sample.length > 0
        ? ((potentialDuplicates / (sample.length * (sample.length - 1) / 2)) * 100).toFixed(2) + '%'
        : 'N/A'
    };

  } catch (error) {
    console.error('Duplicate stats error:', error.message);
    return { error: error.message };
  }
};

/**
 * Store embedding for a complaint (for future ONNX integration)
 */
const storeEmbedding = async (complaintId, embedding, category) => {
  await EmbeddingCache.findByIdAndUpdate(
    complaintId,
    {
      _id: complaintId,
      complaintId,
      embedding,
      category,
      createdAt: new Date()
    },
    { upsert: true }
  );
};

/**
 * Get embedding for a complaint
 */
const getEmbedding = async (complaintId) => {
  const cached = await EmbeddingCache.findById(complaintId);
  return cached?.embedding || null;
};

module.exports = {
  findSimilar,
  isDuplicate,
  findSimilarTFIDF,
  findSimilarJaccard,
  getDuplicateStats,
  storeEmbedding,
  getEmbedding,
  EmbeddingCache,
  SIMILARITY_THRESHOLD,
  cosineSimilarity
};

