/**
 * LRU Cache Implementation
 *
 * In-memory Least Recently Used cache with:
 * - Fixed maximum size (prevents memory growth)
 * - TTL-based expiration
 * - Automatic eviction of least recently used items
 * - Thread-safe operations
 *
 * Performance Targets:
 * - Get: O(1)
 * - Set: O(1)
 * - Memory: ~10MB max (1000 items)
 */

class LRUCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.ttlMs = options.ttlMs || 5 * 60 * 1000; // 5 minutes default
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      sets: 0
    };
  }

  /**
   * Get item from cache
   * @param {string} key
   * @returns {*} value or undefined
   */
  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      this.stats.misses++;
      return undefined;
    }

    // Check TTL expiration
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);

    this.stats.hits++;
    return item.value;
  }

  /**
   * Set item in cache
   * @param {string} key
   * @param {*} value
   * @param {number} ttlMs - Optional custom TTL
   */
  set(key, value, ttlMs = this.ttlMs) {
    // If key exists, delete first (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest items if at capacity
    while (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }

    // Add new item
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now()
    });

    this.stats.sets++;
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Delete item from cache
   * @param {string} key
   * @returns {boolean}
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Clear all items
   */
  clear() {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      sets: 0
    };
  }

  /**
   * Get current size
   * @returns {number}
   */
  get size() {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   * @returns {Object}
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0%',
      evictions: this.stats.evictions,
      sets: this.stats.sets
    };
  }

  /**
   * Cleanup expired entries
   * Call periodically to prevent stale data buildup
   * @returns {number} Number of items removed
   */
  cleanup() {
    const now = Date.now();
    let removed = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }
}

// Singleton instances for different cache purposes
const instances = {};

/**
 * Get or create a named LRU cache instance
 * @param {string} name - Cache name
 * @param {Object} options - Cache options
 * @returns {LRUCache}
 */
const getInstance = (name = 'default', options = {}) => {
  if (!instances[name]) {
    instances[name] = new LRUCache(options);
  }
  return instances[name];
};

/**
 * Get all cache instances stats
 * @returns {Object}
 */
const getAllStats = () => {
  const stats = {};
  for (const [name, cache] of Object.entries(instances)) {
    stats[name] = cache.getStats();
  }
  return stats;
};

/**
 * Clear all cache instances
 */
const clearAll = () => {
  for (const cache of Object.values(instances)) {
    cache.clear();
  }
};

module.exports = {
  LRUCache,
  getInstance,
  getAllStats,
  clearAll
};

