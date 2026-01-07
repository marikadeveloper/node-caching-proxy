/**
 * Proxy Server

 * Create an HTTP server
 * For each incoming request:
 * 
 * Check if it's cached → return with X-Cache: HIT
 * If not cached → forward to origin → cache response → return with X-Cache: MISS
 * 
 * 
 * Forward the request to the origin server using axios
 * Return the response with appropriate headers
 */
const http = require('http');
const axios = require('axios');
const cache = require('./cache');

class ProxyServer {
  constructor(port, origin) {
    this.port = port;
    this.origin = origin;
    this.server = null;
  }

  /**
   * Start the proxy server
   */
  start() {
    // Create HTTP server
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    // Start listening on specified port
    this.server.listen(this.port, () => {
      console.log(
        `🚀 Caching proxy server running on http://localhost:${this.port}`,
      );
      console.log(`📡 Forwarding requests to ${this.origin}`);
      console.log(`\nPress Ctrl+C to stop\n`);
    });

    // Handle server errors
    this.server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Error: Port ${this.port} is already in use`);
      } else {
        console.error('❌ Server error:', err.message);
      }
      process.exit(1);
    });
  }

  /**
   * Handle incoming HTTP requests
   * This is the core logic of our proxy
   */
  async handleRequest(req, res) {
    const method = req.method;
    const url = req.url;

    console.log(`\n→ ${method} ${url}`);

    try {
      // Step 1: Check if response is in cache
      if (cache.has(method, url)) {
        console.log('  ✓ Cache HIT');
        this.sendCachedResponse(req, res, method, url);
        return;
      }

      // Step 2: Cache MISS - forward to origin server
      console.log('  ✗ Cache MISS - Forwarding to origin');
      await this.forwardRequest(req, res, method, url);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Send a cached response back to the client
   */
  sendCachedResponse(req, res, method, url) {
    const cached = cache.get(method, url);

    // Set the cached response headers
    // We spread the original headers and add our custom X-Cache header
    res.writeHead(cached.status, {
      ...cached.headers,
      'X-Cache': 'HIT',
      'X-Cached-At': cached.cachedAt,
    });

    // Send the cached data
    // We need to handle both string and object responses
    if (typeof cached.data === 'object') {
      res.end(JSON.stringify(cached.data));
    } else {
      res.end(cached.data);
    }
  }

  /**
   * Forward the request to the origin server
   */
  async forwardRequest(req, res, method, url) {
    // Build the complete URL by combining origin + request path
    const targetUrl = `${this.origin}${url}`;

    // Collect the request body (for POST/PUT requests)
    const body = await this.getRequestBody(req);

    // Forward the request to origin server using axios
    const response = await axios({
      method: method,
      url: targetUrl,
      data: body,
      headers: this.getForwardHeaders(req.headers),
      // Important: Tell axios not to throw on non-2xx responses
      // We want to cache and return all responses, not just successful ones
      validateStatus: () => true,
    });

    // Cache the response only for GET requests and successful responses
    // You typically don't cache POST/PUT/DELETE or error responses
    if (method === 'GET' && response.status === 200) {
      cache.set(method, url, response);
    }

    // Send response back to client
    res.writeHead(response.status, {
      ...response.headers,
      'X-Cache': 'MISS',
    });

    // Handle response data
    if (typeof response.data === 'object') {
      res.end(JSON.stringify(response.data));
    } else {
      res.end(response.data);
    }
  }

  /**
   * Get the request body from incoming request
   * This is necessary for POST/PUT requests
   */
  getRequestBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';

      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', () => {
        resolve(body);
      });

      req.on('error', reject);
    });
  }

  /**
   * Filter and prepare headers to forward to origin
   * We remove some headers that shouldn't be forwarded
   */
  getForwardHeaders(headers) {
    const forwardHeaders = { ...headers };

    // Remove headers that shouldn't be forwarded
    delete forwardHeaders.host; // Host should be the origin's host
    delete forwardHeaders.connection;
    delete forwardHeaders['content-length']; // Will be recalculated by axios

    return forwardHeaders;
  }

  /**
   * Handle errors that occur during request processing
   */
  handleError(res, error) {
    console.error('  ❌ Error:', error.message);

    let statusCode = 500;
    let message = 'Internal Server Error';

    // Handle specific error cases
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      statusCode = 502;
      message = 'Bad Gateway - Could not reach origin server';
    } else if (error.code === 'ETIMEDOUT') {
      statusCode = 504;
      message = 'Gateway Timeout';
    }

    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: message,
        details: error.message,
      }),
    );
  }

  /**
   * Stop the server
   */
  stop() {
    if (this.server) {
      this.server.close(() => {
        console.log('Server stopped');
      });
    }
  }
}

module.exports = ProxyServer;
