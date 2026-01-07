/**
 * Proxy Server

 * Create an HTTP server (use Node's built-in http module)
 * For each incoming request:
 * 
 * Check if it's cached → return with X-Cache: HIT
 * If not cached → forward to origin → cache response → return with X-Cache: MISS
 * 
 * 
 * Forward the request to the origin server using axios
 * Return the response with appropriate headers
 */
