/**
 * Cache Manager

 * Store responses in memory (use a JavaScript Map or plain object)
 * Provide methods: get(key), set(key, value), clear()
 * Cache key should be based on the request URL + method
 */

class Cache {
  constructor() {
    // Using a Map to store cached responses
    // Map is better than plain object for this use case because:
    // - Keys can be any type
    // - Better performance for frequent additions/deletions
    // - Has built-in size property
    this.store = new Map();
  }

  /**
   * Generate a unique cache key based on HTTP method and URL
   * Example: "GET:/products" or "POST:/users"
   * This ensures different methods to same URL are cached separately
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {string} url - Request URL
   * @returns {string} - unique cache key
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
   * Store a response in cache
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Object} response - Response data to cache
   */
  set(method, url, response) {
    const key = this.generateKey(method, url);

    // We store the complete response including:
    // - status: HTTP status code (200, 404, etc.)
    // - headers: Response headers from origin server
    // - data: Actual response body
    this.store.set(key, {
      status: response.status,
      headers: response.headers,
      data: response.data,
      cachedAt: new Date().toISOString(), // Track when it was cached
    });

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
   * Clear all cached responses
   */
  clear() {
    const size = this.store.size;
    this.store.clear();
    console.log(`✓ Cleared ${size} cached responses`);
  }

  /**
   * Get cache statistics
   * @returns {Object} - Stats about the cache
   */
  getStats() {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }
}

// Export a single instance (Singleton pattern)
// This ensures we have one cache shared across the application
module.exports = new Cache();
