# Node.js Caching Proxy

A tiny, zero-dependency caching proxy for Node.js that caches responses from an origin server to improve performance and reduce repeated network load.

Badges: Node · MIT

## Table of contents

- [Quick start](#quick-start)
- [Usage](#usage)
- [Options](#options)
- [Example](#example)
- [How it works](#how-it-works)
- [Clearing cache](#clearing-cache)
- [Contributing](#contributing)
- [License](#license)

## Quick start

Make the main script executable (Linux/Mac):

```bash
chmod +x index.js
```

Link globally (optional — exposes the `caching-proxy` command):

```bash
npm link
caching-proxy --port 3000 --origin http://dummyjson.com
```

Or run directly:

```bash
node index.js --port 3000 --origin http://dummyjson.com
```

## Usage

Start the proxy and point your client at it. The proxy forwards requests to the origin and caches responses to speed up subsequent requests.

### Options

- --port <number> — port to listen on (e.g., 3000)
- --origin <url> — origin/base URL to proxy (e.g., http://dummyjson.com)
- --clear-cache — clears the cache file(s) and exits

## Example

1. Start the proxy:

```bash
caching-proxy --port 3000 --origin http://dummyjson.com
```

2. First request (cache MISS):

```bash
curl -i http://localhost:3000/products
# Look for: X-Cache: MISS
```

3. Second request (cache HIT):

```bash
curl -i http://localhost:3000/products
# Look for: X-Cache: HIT
```

A cache file (e.g., `cache-data.json`) is created in the project folder to persist cached entries.

## How it works

- Requests are proxied to the configured origin.
- Responses are saved to a local cache with a simple key (request path).
- Subsequent identical requests are served from cache until cleared.

## Clearing cache

```bash
caching-proxy --clear-cache
```

## Contributing

Small improvements and bug fixes welcome. Open a PR with a short description of the change.

## License

MIT
