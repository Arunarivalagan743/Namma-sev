/**
 * Unified Cache Interface
 *
 * Two-layer caching strategy:
 * - L1: In-memory LRU (fast, limited size)
 * - L2: MongoDB (persistent, large capacity)
 *
 * Read Flow:
 * 1. Check L1 → Hit? Return
 * 2. Check L2 → Hit? Promote to L1, Return
 * 3. Miss → Return null
 *
 * Write Flow:
 * 1. Write to L1
 * 2. Async write to L2 (non-blocking)
 *
 * Performance Targets:
 * - L1 hit: <1ms
 * - L2 hit: <10ms
 * - Total cache hit rate: >90%
 */

const lruCache = require('./lru.cache');
const mongoCache = require('./mongo.cache');

/**
 * Two-layer cache wrapper
 */
class TwoLayerCache {
  constructor(namespace, options = {}) {
    this.namespace = namespace;

    // L1: In-memory LRU
    this.l1 = lruCache.getInstance(namespace, {
      maxSize: options.l1MaxSize || 1000,
      ttlMs: options.l1TtlMs || 5 * 60 * 1000  // 5 minutes
    });

    // L2: MongoDB
    this.l2 = mongoCache.getInstance(namespace, {
      ttlMs: options.l2TtlMs || 30 * 24 * 60 * 60 * 1000  // 30 days
    });

    this.stats = {
      l1Hits: 0,
      l2Hits: 0,
      misses: 0
    };
  }

  /**
   * Get value from cache
   * @param {string} key
   * @returns {Promise<*>}
   */
  async get(key) {
    // Try L1 first
    const l1Value = this.l1.get(key);
    if (l1Value !== undefined) {
      this.stats.l1Hits++;
      return l1Value;
    }

    // Try L2
    const l2Value = await this.l2.get(key);
    if (l2Value !== null) {
      // Promote to L1
      this.l1.set(key, l2Value);
      this.stats.l2Hits++;
      return l2Value;
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set value in cache
   * @param {string} key
   * @param {*} value
   * @param {Object} options
   */
  async set(key, value, options = {}) {
    // Always write to L1 synchronously
    this.l1.set(key, value, options.l1TtlMs);

    // Write to L2 asynchronously (non-blocking)
    this.l2.set(key, value, { ttlMs: options.l2TtlMs }).catch(err => {
      console.error(`L2 cache write error [${this.namespace}]:`, err.message);
    });
  }

  /**
   * Set value synchronously in both layers
   * Use when persistence is critical
   */
  async setSync(key, value, options = {}) {
    this.l1.set(key, value, options.l1TtlMs);
    await this.l2.set(key, value, { ttlMs: options.l2TtlMs });
  }

  /**
   * Delete from both layers
   */
  async delete(key) {
    this.l1.delete(key);
    await this.l2.delete(key);
  }

  /**
   * Check if key exists in either layer
   */
  async has(key) {
    if (this.l1.has(key)) return true;
    return await this.l2.has(key);
  }

  /**
   * Clear both layers
   */
  async clear() {
    this.l1.clear();
    await this.l2.clear();
    this.stats = { l1Hits: 0, l2Hits: 0, misses: 0 };
  }

  /**
   * Get combined statistics
   */
  async getStats() {
    const l1Stats = this.l1.getStats();
    const l2Stats = await this.l2.getStats();
    const total = this.stats.l1Hits + this.stats.l2Hits + this.stats.misses;

    return {
      namespace: this.namespace,
      l1: l1Stats,
      l2: l2Stats,
      combined: {
        l1Hits: this.stats.l1Hits,
        l2Hits: this.stats.l2Hits,
        misses: this.stats.misses,
        totalHitRate: total > 0
          ? ((this.stats.l1Hits + this.stats.l2Hits) / total * 100).toFixed(2) + '%'
          : '0%',
        l1HitRate: total > 0
          ? (this.stats.l1Hits / total * 100).toFixed(2) + '%'
          : '0%'
      }
    };
  }
}

// Cache instances registry
const instances = {};

/**
 * Get or create a two-layer cache
 * @param {string} namespace
 * @param {Object} options
 * @returns {TwoLayerCache}
 */
const getCache = (namespace, options = {}) => {
  if (!instances[namespace]) {
    instances[namespace] = new TwoLayerCache(namespace, options);
  }
  return instances[namespace];
};

/**
 * Pre-configured cache for translations
 */
const translationCache = () => getCache('translations', {
  l1MaxSize: 500,
  l1TtlMs: 10 * 60 * 1000,     // 10 minutes in memory
  l2TtlMs: 30 * 24 * 60 * 60 * 1000  // 30 days in MongoDB
});

/**
 * Pre-configured cache for embeddings
 */
const embeddingCache = () => getCache('embeddings', {
  l1MaxSize: 200,
  l1TtlMs: 30 * 60 * 1000,    // 30 minutes in memory
  l2TtlMs: 90 * 24 * 60 * 60 * 1000  // 90 days in MongoDB
});

/**
 * Pre-configured cache for AI results
 */
const aiResultCache = () => getCache('ai_results', {
  l1MaxSize: 300,
  l1TtlMs: 5 * 60 * 1000,     // 5 minutes in memory
  l2TtlMs: 24 * 60 * 60 * 1000  // 24 hours in MongoDB
});

/**
 * Get all cache statistics
 */
const getAllStats = async () => {
  const stats = {};
  for (const [name, cache] of Object.entries(instances)) {
    stats[name] = await cache.getStats();
  }
  return stats;
};

/**
 * Clear all caches
 */
const clearAll = async () => {
  for (const cache of Object.values(instances)) {
    await cache.clear();
  }
};

module.exports = {
  TwoLayerCache,
  getCache,
  translationCache,
  embeddingCache,
  aiResultCache,
  getAllStats,
  clearAll,
  // Export underlying layers for direct access if needed
  lruCache,
  mongoCache
};

