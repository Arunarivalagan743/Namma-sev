/**
 * Translation Cache Service
 *
 * Caches translations to avoid repeated API calls to Google Translate.
 * Uses the unified two-layer cache (L1: LRU, L2: MongoDB).
 *
 * Performance Targets:
 * - Cache hit: <5ms
 * - Cache hit rate: >90%
 * - Cost reduction: >90%
 */

const crypto = require('crypto');
const { translationCache } = require('./cache');

// Get the pre-configured translation cache
const cache = translationCache();

/**
 * Generate a unique cache key for a translation request
 * Uses SHA256 hash to handle any text safely
 */
const generateCacheKey = (text, sourceLang, targetLang) => {
  const normalized = text.trim();
  return crypto.createHash('sha256')
    .update(`${normalized}|${sourceLang}|${targetLang}`)
    .digest('hex')
    .substring(0, 32);  // Shorter keys for efficiency
};

/**
 * Get a cached translation
 * @param {string} text - Source text
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @returns {Promise<string|null>} - Cached translation or null
 */
const getCachedTranslation = async (text, sourceLang = 'en', targetLang) => {
  try {
    const key = generateCacheKey(text, sourceLang, targetLang);
    const cached = await cache.get(key);

    if (cached) {
      console.log(`📚 Translation cache HIT [${targetLang}]: "${text.substring(0, 30)}..."`);
      return cached;
    }

    console.log(`📭 Translation cache MISS [${targetLang}]: "${text.substring(0, 30)}..."`);
    return null;
  } catch (error) {
    console.error('Translation cache get error:', error.message);
    return null;
  }
};

/**
 * Cache a translation
 * @param {string} text - Source text
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @param {string} translatedText - Translated text
 */
const cacheTranslation = async (text, sourceLang = 'en', targetLang, translatedText) => {
  try {
    const key = generateCacheKey(text, sourceLang, targetLang);
    await cache.set(key, translatedText);
    console.log(`💾 Translation cached [${targetLang}]: "${text.substring(0, 30)}..."`);
  } catch (error) {
    console.error('Translation cache set error:', error.message);
  }
};

/**
 * Get or translate with caching
 * Pipeline: Cache Check → API Call (if miss) → Cache Store
 *
 * @param {string} text - Source text
 * @param {string} targetLang - Target language code
 * @param {Function} translateFn - Function to call for actual translation
 * @returns {Promise<string>} - Translated text
 */
const getOrTranslate = async (text, targetLang, translateFn, sourceLang = 'en') => {
  // Same language - return original
  if (targetLang === sourceLang) {
    return text;
  }

  // Check cache first
  const cached = await getCachedTranslation(text, sourceLang, targetLang);
  if (cached) {
    return cached;
  }

  // Call translation function
  const translated = await translateFn(text, targetLang, sourceLang);

  // Cache the result (async, non-blocking)
  cacheTranslation(text, sourceLang, targetLang, translated).catch(() => {});

  return translated;
};

/**
 * Batch cache multiple translations
 * Useful for pre-populating cache with static content
 */
const batchCache = async (translations) => {
  const promises = translations.map(t =>
    cacheTranslation(t.text, t.sourceLang || 'en', t.targetLang, t.translatedText)
  );

  await Promise.allSettled(promises);
  console.log(`💾 Batch cached ${translations.length} translations`);
};

/**
 * Get cache statistics
 */
const getCacheStats = async () => {
  return await cache.getStats();
};

/**
 * Clear translation cache
 * @param {Object} options - Filter options
 */
const clearCache = async (options = {}) => {
  if (Object.keys(options).length === 0) {
    await cache.clear();
    return { cleared: 'all' };
  }
  // For filtered clearing, would need to iterate - simplified for now
  await cache.clear();
  return { cleared: 'all' };
};

module.exports = {
  generateCacheKey,
  getCachedTranslation,
  cacheTranslation,
  getOrTranslate,
  batchCache,
  getCacheStats,
  clearCache
};

