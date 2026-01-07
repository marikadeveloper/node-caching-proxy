# Node.js Caching Proxy

A simple caching proxy server built with Node.js. This server caches responses from target servers to improve performance and reduce load times for frequently accessed resources. It's a learning project to upskill my Node.js and networking knowledge.

## Usage

### Make index.js executable (Linux/Mac)

chmod +x index.js

### Link it globally (creates the caching-proxy command)

```bash
npm link
caching-proxy --port 3000 --origin http://dummyjson.com
```

### Or if you want to run without linking:

```bash
node index.js --port 3000 --origin http://dummyjson.com
```

## Example

### Terminal 1 - Start the proxy:

```bash
caching-proxy --port 3000 --origin http://dummyjson.com
```

### Terminal 2 - Make requests:

First request (should be MISS)

```bash
curl -i http://localhost:3000/products
```

Look for: X-Cache: MISS in the headers
You should see "cache-data.json" file created in your project folder

#### Second request (should be HIT)

```bash
curl -i http://localhost:3000/products
```

Look for: X-Cache: HIT in the headers

#### Clear cache

```bash
caching-proxy --clear-cache
```
