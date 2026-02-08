/**
 * Semantic Search Service
 *
 * Phase 2 Feature 1: Search across Schemes, FAQs, and Announcements
 *
 * Architecture:
 * - Pre-indexed content (NOT query-time embedding)
 * - TF-IDF based similarity (lightweight, no external deps)
 * - Uses existing preprocessor and cache layer
 * - Top-K retrieval (K ≤ 10)
 *
 * Performance Targets:
 * - Search latency: <20ms
 * - Memory: <10MB additional
 * - CPU: <5% during search
 */

const preprocessor = require('./preprocessor');
const { getCache } = require('./cache');

// Get search index cache
const indexCache = getCache('search_index', {
  l1MaxSize: 100,
  l1TtlMs: 30 * 60 * 1000,      // 30 minutes in memory
  l2TtlMs: 24 * 60 * 60 * 1000  // 24 hours in MongoDB
});

// Configuration
const CONFIG = {
  maxResults: 10,
  minScore: 0.1,
  contentTypes: ['schemes', 'faqs', 'announcements', 'news'],
  indexRefreshIntervalMs: 60 * 60 * 1000  // 1 hour
};

// In-memory search index (rebuilt periodically)
let searchIndex = {
  documents: [],      // { id, type, title, content, tokens, tfidfVector }
  idf: {},            // term -> IDF score
  lastUpdated: null,
  isBuilding: false
};

/**
 * Calculate IDF for all terms in the corpus
 */
const calculateIDF = (documents) => {
  const docFreq = {};
  const numDocs = documents.length;

  documents.forEach(doc => {
    const uniqueTerms = new Set(doc.tokens);
    uniqueTerms.forEach(term => {
      docFreq[term] = (docFreq[term] || 0) + 1;
    });
  });

  const idf = {};
  Object.entries(docFreq).forEach(([term, freq]) => {
    idf[term] = Math.log((numDocs + 1) / (freq + 1)) + 1;  // Smoothed IDF
  });

  return idf;
};

/**
 * Calculate TF-IDF vector for a document
 */
const calculateTFIDF = (tokens, idf) => {
  const termFreq = {};
  tokens.forEach(token => {
    termFreq[token] = (termFreq[token] || 0) + 1;
  });

  const vector = {};
  const maxFreq = Math.max(...Object.values(termFreq));

  Object.entries(termFreq).forEach(([term, freq]) => {
    const tf = 0.5 + 0.5 * (freq / maxFreq);  // Augmented TF
    vector[term] = tf * (idf[term] || 1);
  });

  return vector;
};

/**
 * Calculate cosine similarity between two TF-IDF vectors
 */
const cosineSimilarity = (vec1, vec2) => {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  const allTerms = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);

  allTerms.forEach(term => {
    const v1 = vec1[term] || 0;
    const v2 = vec2[term] || 0;
    dotProduct += v1 * v2;
    norm1 += v1 * v1;
    norm2 += v2 * v2;
  });

  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
};

/**
 * Build search index from content
 * Called asynchronously, does not block requests
 */
const buildIndex = async (forceRefresh = false) => {
  // Prevent concurrent builds
  if (searchIndex.isBuilding) {
    return { status: 'already_building' };
  }

  // Check if refresh needed
  const now = Date.now();
  if (!forceRefresh && searchIndex.lastUpdated &&
      (now - searchIndex.lastUpdated) < CONFIG.indexRefreshIntervalMs) {
    return { status: 'up_to_date', lastUpdated: searchIndex.lastUpdated };
  }

  searchIndex.isBuilding = true;
  const startTime = Date.now();

  try {
    // Import models dynamically to avoid circular deps
    const { GovernmentScheme } = require('../models/Scheme');
    const { FAQ } = require('../models/FAQ');
    const Announcement = require('../models/Announcement');

    // Fetch content in parallel
    const [schemes, faqs, announcements] = await Promise.all([
      GovernmentScheme.find({ isActive: true })
        .select('_id title description eligibility benefits')
        .lean()
        .catch(() => []),
      FAQ.find({ isActive: true })
        .select('_id question answer category')
        .lean()
        .catch(() => []),
      Announcement.find({ isActive: true })
        .select('_id title content category')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean()
        .catch(() => [])
    ]);

    // Build document list
    const documents = [];

    // Process schemes
    schemes.forEach(s => {
      const content = `${s.title} ${s.description || ''} ${s.eligibility || ''} ${s.benefits || ''}`;
      const tokens = preprocessor.tokenize(content);
      documents.push({
        id: s._id,
        type: 'scheme',
        title: s.title,
        content: content.substring(0, 200),
        tokens
      });
    });

    // Process FAQs
    faqs.forEach(f => {
      const content = `${f.question} ${f.answer}`;
      const tokens = preprocessor.tokenize(content);
      documents.push({
        id: f._id,
        type: 'faq',
        title: f.question,
        content: f.answer.substring(0, 200),
        category: f.category,
        tokens
      });
    });

    // Process announcements
    announcements.forEach(a => {
      const content = `${a.title} ${a.content || ''}`;
      const tokens = preprocessor.tokenize(content);
      documents.push({
        id: a._id,
        type: 'announcement',
        title: a.title,
        content: (a.content || '').substring(0, 200),
        category: a.category,
        tokens
      });
    });

    // Calculate IDF
    const idf = calculateIDF(documents);

    // Calculate TF-IDF vectors
    documents.forEach(doc => {
      doc.tfidfVector = calculateTFIDF(doc.tokens, idf);
      delete doc.tokens;  // Free memory
    });

    // Update index
    searchIndex = {
      documents,
      idf,
      lastUpdated: now,
      isBuilding: false
    };

    const buildTime = Date.now() - startTime;
    console.log(`🔍 Search index built: ${documents.length} documents in ${buildTime}ms`);

    return {
      status: 'rebuilt',
      documentCount: documents.length,
      buildTimeMs: buildTime
    };

  } catch (error) {
    searchIndex.isBuilding = false;
    console.error('Search index build error:', error.message);
    return { status: 'error', error: error.message };
  }
};

/**
 * Search for content matching a query
 *
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Array} - Ranked results
 */
const search = async (query, options = {}) => {
  const startTime = Date.now();

  const {
    types = CONFIG.contentTypes,
    maxResults = CONFIG.maxResults,
    minScore = CONFIG.minScore
  } = options;

  // Ensure index is built
  if (!searchIndex.lastUpdated || searchIndex.documents.length === 0) {
    await buildIndex();
  }

  // Preprocess query
  const queryTokens = preprocessor.tokenize(query);
  if (queryTokens.length === 0) {
    return { results: [], latencyMs: Date.now() - startTime };
  }

  // Calculate query TF-IDF
  const queryVector = calculateTFIDF(queryTokens, searchIndex.idf);

  // Score all documents
  const scored = searchIndex.documents
    .filter(doc => types.includes(doc.type))
    .map(doc => ({
      ...doc,
      score: cosineSimilarity(queryVector, doc.tfidfVector)
    }))
    .filter(doc => doc.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  // Clean up results (remove internal fields)
  const results = scored.map(({ tfidfVector, ...doc }) => ({
    ...doc,
    score: Math.round(doc.score * 100) / 100
  }));

  return {
    results,
    query: query.substring(0, 50),
    totalMatches: scored.length,
    latencyMs: Date.now() - startTime
  };
};

/**
 * Get search index statistics
 */
const getIndexStats = () => {
  return {
    documentCount: searchIndex.documents.length,
    termCount: Object.keys(searchIndex.idf).length,
    lastUpdated: searchIndex.lastUpdated,
    isBuilding: searchIndex.isBuilding,
    byType: searchIndex.documents.reduce((acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    }, {})
  };
};

/**
 * Refresh index (called by scheduler or manually)
 */
const refreshIndex = async () => {
  return await buildIndex(true);
};

module.exports = {
  search,
  buildIndex,
  refreshIndex,
  getIndexStats,
  CONFIG
};

