/**
 * Cache Manager

 * Store responses in memory (use a JavaScript Map or plain object)
 * Provide methods: get(key), set(key, value), clear()
 * Cache key should be based on the request URL + method
 */

const fs = require('fs');
const path = require('path');

class Cache {
  constructor() {
    // Define cache file path - stores in the same directory as the script
    this.cacheFile = path.join(__dirname, 'cache-data.json');

    // Using a Map to store cached responses in memory
    this.store = new Map();

    // Load existing cache from disk when cache is initialized
    this.load();
  }

  /**
   * Load cache from disk into memory
   * This runs when the cache is first created
   */
  load() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const data = fs.readFileSync(this.cacheFile, 'utf8');
        const parsed = JSON.parse(data);

        // Convert the plain object back into a Map
        // JSON can't store Maps directly, so we store as array of [key, value] pairs
        this.store = new Map(parsed);

        console.log(`📦 Loaded ${this.store.size} cached responses from disk`);
      }
    } catch (error) {
      console.error('⚠️  Error loading cache from disk:', error.message);
      // If loading fails, start with empty cache
      this.store = new Map();
    }
  }

  /**
   * Save cache from memory to disk
   * This persists the cache between process restarts
   */
  save() {
    try {
      // Convert Map to array format that JSON can handle
      // Map -> [[key1, value1], [key2, value2], ...]
      const data = JSON.stringify(Array.from(this.store.entries()), null, 2);
      fs.writeFileSync(this.cacheFile, data, 'utf8');
    } catch (error) {
      console.error('⚠️  Error saving cache to disk:', error.message);
    }
  }

  /**
   * Generate a unique cache key based on HTTP method and URL
   * Example: "GET:/products" or "POST:/users"
   */
  generateKey(method, url) {
    return `${method}:${url}`;
  }

  /**
   * Get a cached response
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {string} url - Request URL
   * @returns {Object|null} - Cached response or null if not found
   */
  get(method, url) {
    const key = this.generateKey(method, url);
    return this.store.get(key) || null;
  }

  /**
   * Store a response in cache (both memory and disk)
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Object} response - Response data to cache
   */
  set(method, url, response) {
    const key = this.generateKey(method, url);

    // Store in memory
    this.store.set(key, {
      status: response.status,
      headers: response.headers,
      data: response.data,
      cachedAt: new Date().toISOString(),
    });

    // Persist to disk immediately after each cache write
    // This ensures cache survives server restarts
    this.save();

    console.log(`✓ Cached: ${key}`);
  }

  /**
   * Check if a response exists in cache
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @returns {boolean}
   */
  has(method, url) {
    const key = this.generateKey(method, url);
    return this.store.has(key);
  }

  /**
   * Clear all cached responses (both memory and disk)
   */
  clear() {
    const size = this.store.size;

    // Clear memory
    this.store.clear();

    // Delete the cache file from disk
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
   * @returns {Object} - Stats about the cache
   */
  getStats() {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
      cacheFile: this.cacheFile,
    };
  }
}

// Export a single instance (Singleton pattern)
module.exports = new Cache();
