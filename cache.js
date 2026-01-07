/**
 * Cache Manager

 * Store responses in memory (use a JavaScript Map or plain object)
 * Provide methods: get(key), set(key, value), clear()
 * Cache key should be based on the request URL + method
 */

const fs = require('fs');
const path = require('path');

class Cache {
  constructor(config) {
    // Configuration from config module
    this.cacheFile = path.join(process.cwd(), config.cache.cacheFile);
    this.maxSize = config.cache.maxSize;
    this.ttl = config.cache.ttl;
    this.enabled = config.cache.enabled;
    this.verbose = config.logging.verbose;

    // Map stores: key -> { value, timestamp, accessCount }
    this.store = new Map();

    // Track access order for LRU (Least Recently Used) eviction
    this.accessOrder = [];

    // Load existing cache from disk
    this.load();
  }

  /**
   * Load cache from disk into memory
   */
  load() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const data = fs.readFileSync(this.cacheFile, 'utf8');
        const parsed = JSON.parse(data);

        // Convert array back to Map
        this.store = new Map(parsed.entries);
        this.accessOrder = parsed.accessOrder || [];

        // Clean expired entries on load
        this.cleanExpired();

        console.log(`📦 Loaded ${this.store.size} cached responses from disk`);
      }
    } catch (error) {
      console.error('⚠️  Error loading cache from disk:', error.message);
      this.store = new Map();
      this.accessOrder = [];
    }
  }

  /**
   * Save cache from memory to disk
   */
  save() {
    try {
      const data = JSON.stringify(
        {
          entries: Array.from(this.store.entries()),
          accessOrder: this.accessOrder,
          savedAt: new Date().toISOString(),
        },
        null,
        2,
      );

      fs.writeFileSync(this.cacheFile, data, 'utf8');
    } catch (error) {
      console.error('⚠️  Error saving cache to disk:', error.message);
    }
  }

  /**
   * Generate a unique cache key
   */
  generateKey(method, url) {
    return `${method}:${url}`;
  }

  /**
   * Check if a cache entry has expired
   */
  isExpired(entry) {
    const now = Date.now();
    const age = now - entry.timestamp;
    return age > this.ttl;
  }

  /**
   * Clean expired entries from cache
   */
  cleanExpired() {
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      if (this.isExpired(entry)) {
        this.store.delete(key);
        // Remove from access order
        this.accessOrder = this.accessOrder.filter((k) => k !== key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
      this.save();
    }

    return cleaned;
  }

  /**
   * Evict least recently used entry when cache is full
   */
  evictLRU() {
    if (this.accessOrder.length === 0) return;

    // Remove the least recently accessed item (first in array)
    const lruKey = this.accessOrder.shift();
    this.store.delete(lruKey);

    console.log(`🗑️  Evicted LRU entry: ${lruKey}`);
  }

  /**
   * Update access order for LRU tracking
   */
  updateAccessOrder(key) {
    // Remove key from current position
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    // Add to end (most recently used)
    this.accessOrder.push(key);
  }

  /**
   * Get a cached response
   */
  get(method, url) {
    if (!this.enabled) return null;

    const key = this.generateKey(method, url);
    const entry = this.store.get(key);

    if (!entry) return null;

    // Check if expired
    if (this.isExpired(entry)) {
      console.log(`⏰ Cache entry expired: ${key}`);
      this.store.delete(key);
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
      this.save();
      return null;
    }

    // Update access tracking
    entry.accessCount = (entry.accessCount || 0) + 1;
    entry.lastAccessed = Date.now();
    this.updateAccessOrder(key);

    return entry.value;
  }

  /**
   * Store a response in cache
   */
  set(method, url, response) {
    if (!this.enabled) return;

    const key = this.generateKey(method, url);

    // If we're at max size, evict the least recently used entry
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      this.evictLRU();
    }

    // Store with metadata
    this.store.set(key, {
      value: {
        status: response.status,
        headers: response.headers,
        data: response.data,
        cachedAt: new Date().toISOString(),
      },
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
    });

    // Update access order
    this.updateAccessOrder(key);

    // Save to disk
    this.save();

    if (this.verbose) {
      console.log(`✓ Cached: ${key} (${this.store.size}/${this.maxSize})`);
    }
  }

  /**
   * Check if a response exists in cache and is not expired
   */
  has(method, url) {
    const key = this.generateKey(method, url);
    const entry = this.store.get(key);

    if (!entry) return false;

    // Check if expired
    if (this.isExpired(entry)) {
      this.store.delete(key);
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
      return false;
    }

    return true;
  }

  /**
   * Clear all cached responses
   */
  clear() {
    const size = this.store.size;

    this.store.clear();
    this.accessOrder = [];

    try {
      if (fs.existsSync(this.cacheFile)) {
        fs.unlinkSync(this.cacheFile);
      }
      console.log(`✓ Cleared ${size} cached responses`);
    } catch (error) {
      console.error('⚠️  Error clearing cache file:', error.message);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    // Calculate total cache size in bytes
    let totalSize = 0;
    for (const [_, entry] of this.store.entries()) {
      const entrySize = JSON.stringify(entry).length;
      totalSize += entrySize;
    }

    return {
      size: this.store.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      keys: Array.from(this.store.keys()),
      cacheFile: this.cacheFile,
      // Show which entries will expire soon
      expiringKeys: this.getExpiringKeys(5),
    };
  }

  /**
   * Get keys that will expire within the next N minutes
   */
  getExpiringKeys(minutes = 5) {
    const threshold = minutes * 60 * 1000;
    const now = Date.now();
    const expiring = [];

    for (const [key, entry] of this.store.entries()) {
      const timeLeft = this.ttl - (now - entry.timestamp);
      if (timeLeft > 0 && timeLeft < threshold) {
        expiring.push({
          key,
          expiresIn: Math.round(timeLeft / 1000) + 's',
        });
      }
    }

    return expiring;
  }
}

// Create a factory function instead of direct export
// This allows us to pass config when creating the cache
module.exports = Cache;
