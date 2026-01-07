# Caching Proxy Server

A configurable CLI-based caching proxy server that forwards HTTP requests and caches responses for improved performance.

## Installation

```bash
npm install
chmod +x index.js
npm link
```

## Basic Usage

### Start the proxy server

```bash
caching-proxy --port 3000 --origin http://dummyjson.com
```

### Clear the cache

```bash
caching-proxy --clear-cache
```

## Configuration

### Initialize Configuration File

Create a default configuration file:

```bash
caching-proxy --init-config
```

This creates `proxy-config.json` in your current directory with default settings.

### View Current Configuration

```bash
caching-proxy --show-config
```

### Configuration File Options

Edit `proxy-config.json` to customize behavior:

```json
{
  "cache": {
    "maxSize": 100, // Maximum cached entries (prevents unlimited growth)
    "ttl": 3600000, // Time to live in milliseconds (1 hour = 3600000)
    "enabled": true, // Enable/disable caching
    "cacheFile": "cache-data.json", // Cache storage file name
    "cleanupInterval": 300000 // Auto-cleanup interval in ms (5 min)
  },
  "server": {
    "timeout": 30000, // Request timeout in ms (30 seconds)
    "followRedirects": true, // Follow HTTP redirects
    "maxRedirects": 5 // Maximum redirects to follow
  },
  "logging": {
    "verbose": false, // Enable verbose logging
    "logRequests": true, // Log incoming requests
    "logCache": true // Log cache hits/misses
  }
}
```

### Command-Line Overrides

CLI arguments override configuration file settings:

```bash
# Override max cache size
caching-proxy --port 3000 --origin http://dummyjson.com --max-size 50

# Override TTL (in seconds)
caching-proxy --port 3000 --origin http://dummyjson.com --ttl 1800

# Enable verbose logging
caching-proxy --port 3000 --origin http://dummyjson.com --verbose

# Disable caching (proxy-only mode)
caching-proxy --port 3000 --origin http://dummyjson.com --no-cache

# Override request timeout (in seconds)
caching-proxy --port 3000 --origin http://dummyjson.com --timeout 60
```

### Configuration Precedence

1. **Command-line arguments** (highest priority)
2. **Configuration file** (`proxy-config.json`)
3. **Default values** (lowest priority)

## Common TTL Values

| Duration   | Milliseconds | Seconds |
| ---------- | ------------ | ------- |
| 5 minutes  | 300000       | 300     |
| 30 minutes | 1800000      | 1800    |
| 1 hour     | 3600000      | 3600    |
| 6 hours    | 21600000     | 21600   |
| 24 hours   | 86400000     | 86400   |

## Examples

### Quick start with defaults

```bash
caching-proxy --port 3000 --origin http://dummyjson.com
```

### Development mode (verbose, short TTL)

```bash
caching-proxy --port 3000 --origin http://dummyjson.com --verbose --ttl 300
```

### Production mode (large cache, long TTL)

```bash
caching-proxy --port 3000 --origin http://dummyjson.com --max-size 500 --ttl 7200
```

### Proxy-only mode (no caching)

```bash
caching-proxy --port 3000 --origin http://dummyjson.com --no-cache
```

## Testing

```bash
# Start the proxy
caching-proxy --port 3000 --origin http://dummyjson.com

# In another terminal, make requests
curl -i http://localhost:3000/products
# First request: X-Cache: MISS

curl -i http://localhost:3000/products
# Second request: X-Cache: HIT

# View configuration
caching-proxy --show-config

# Clear cache
caching-proxy --clear-cache
```

## Response Headers

The proxy adds custom headers to responses:

- `X-Cache: HIT` - Response served from cache
- `X-Cache: MISS` - Response fetched from origin server
- `X-Cached-At` - Timestamp when response was cached (only on HIT)

## Cache Management

### Automatic Features

- **TTL Expiration**: Old entries are automatically removed after TTL expires
- **Size Limit**: When cache reaches `maxSize`, least recently used entries are evicted
- **LRU Eviction**: Frequently accessed data stays in cache longer
- **Disk Persistence**: Cache survives server restarts

### Manual Management

```bash
# Clear all cache
caching-proxy --clear-cache

# View cache statistics (stop server with Ctrl+C to see stats)
```

## Architecture

```
┌─────────┐      ┌─────────────┐      ┌────────────┐
│ Client  │─────▶│ Proxy Server│─────▶│   Origin   │
│         │◀─────│   + Cache   │◀─────│   Server   │
└─────────┘      └─────────────┘      └────────────┘
                       │
                       ▼
                 ┌──────────┐
                 │ Disk     │
                 │ Storage  │
                 └──────────┘
```

## Files Created

- `proxy-config.json` - Configuration file (created with `--init-config`)
- `cache-data.json` - Cache storage (created automatically when caching)

## Troubleshooting

### Port already in use

```bash
# Error: Port 3000 is already in use
# Solution: Use a different port
caching-proxy --port 3001 --origin http://dummyjson.com
```

### Cache not clearing

The cache persists to disk. Make sure:

1. No proxy server is running
2. Run `caching-proxy --clear-cache`
3. Check if `cache-data.json` is deleted

### Origin server unreachable

```bash
# Error: Bad Gateway - Could not reach origin server
# Check: Is the origin URL correct?
# Check: Is the origin server running?
```

## Advanced Configuration

### Custom cache file location

Edit `proxy-config.json`:

```json
{
  "cache": {
    "cacheFile": "/path/to/custom-cache.json"
  }
}
```

### Disable request logging

```json
{
  "logging": {
    "logRequests": false,
    "logCache": false
  }
}
```

### Increase timeout for slow APIs

```json
{
  "server": {
    "timeout": 60000 // 60 seconds
  }
}
```

## License

MIT
