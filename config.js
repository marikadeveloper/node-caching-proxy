const fs = require('fs');
const path = require('path');

class Config {
  constructor() {
    // Default configuration
    this.defaults = {
      cache: {
        maxSize: 100, // Maximum number of cached entries
        ttl: 3600000, // Time to live in ms (1 hour)
        enabled: true, // Enable/disable caching
        cacheFile: 'cache-data.json', // Cache storage file
        cleanupInterval: 300000, // Auto-cleanup every 5 minutes
      },
      server: {
        timeout: 30000, // Request timeout in ms (30 seconds)
        followRedirects: true, // Follow HTTP redirects
        maxRedirects: 5, // Maximum number of redirects to follow
      },
      logging: {
        verbose: false, // Enable verbose logging
        logRequests: true, // Log incoming requests
        logCache: true, // Log cache hits/misses
      },
    };

    // Config file path (in current working directory)
    this.configFile = path.join(process.cwd(), 'proxy-config.json');

    // Load configuration
    this.config = this.load();
  }

  /**
   * Load configuration from file or create default
   */
  load() {
    try {
      if (fs.existsSync(this.configFile)) {
        const data = fs.readFileSync(this.configFile, 'utf8');
        const fileConfig = JSON.parse(data);

        // Merge with defaults (file config overrides defaults)
        const merged = this.deepMerge(this.defaults, fileConfig);

        console.log('📝 Loaded configuration from proxy-config.json');
        return merged;
      } else {
        // No config file, use defaults
        return { ...this.defaults };
      }
    } catch (error) {
      console.error('⚠️  Error loading config file:', error.message);
      console.log('Using default configuration');
      return { ...this.defaults };
    }
  }

  /**
   * Create a default configuration file
   */
  createDefault() {
    try {
      const data = JSON.stringify(this.defaults, null, 2);
      fs.writeFileSync(this.configFile, data, 'utf8');
      console.log(`✓ Created default configuration file: ${this.configFile}`);
      return true;
    } catch (error) {
      console.error('❌ Error creating config file:', error.message);
      return false;
    }
  }

  /**
   * Deep merge two objects (used to merge file config with defaults)
   */
  deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source[key] instanceof Object && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * Override config with command-line arguments
   */
  override(cliArgs) {
    // CLI arguments take highest priority
    if (cliArgs.maxSize !== undefined) {
      this.config.cache.maxSize = cliArgs.maxSize;
    }

    if (cliArgs.ttl !== undefined) {
      // Convert from seconds to milliseconds
      this.config.cache.ttl = cliArgs.ttl * 1000;
    }

    if (cliArgs.timeout !== undefined) {
      this.config.server.timeout = cliArgs.timeout * 1000;
    }

    if (cliArgs.verbose !== undefined) {
      this.config.logging.verbose = cliArgs.verbose;
    }

    if (cliArgs.noCache !== undefined) {
      this.config.cache.enabled = !cliArgs.noCache;
    }
  }

  /**
   * Get configuration value
   */
  get(path) {
    // Support dot notation: config.get('cache.maxSize')
    const keys = path.split('.');
    let value = this.config;

    for (const key of keys) {
      value = value[key];
      if (value === undefined) return undefined;
    }

    return value;
  }

  /**
   * Get all configuration
   */
  getAll() {
    return this.config;
  }

  /**
   * Display current configuration
   */
  display() {
    console.log('\n📋 Current Configuration:');
    console.log('─'.repeat(50));

    console.log('\n🗂️  Cache Settings:');
    console.log(`  Max Size:         ${this.config.cache.maxSize} entries`);
    console.log(
      `  TTL:              ${this.config.cache.ttl / 1000}s (${
        this.config.cache.ttl / 60000
      } min)`,
    );
    console.log(`  Enabled:          ${this.config.cache.enabled}`);
    console.log(`  Cache File:       ${this.config.cache.cacheFile}`);
    console.log(
      `  Cleanup Interval: ${this.config.cache.cleanupInterval / 1000}s`,
    );

    console.log('\n🌐 Server Settings:');
    console.log(`  Timeout:          ${this.config.server.timeout / 1000}s`);
    console.log(`  Follow Redirects: ${this.config.server.followRedirects}`);
    console.log(`  Max Redirects:    ${this.config.server.maxRedirects}`);

    console.log('\n📊 Logging Settings:');
    console.log(`  Verbose:          ${this.config.logging.verbose}`);
    console.log(`  Log Requests:     ${this.config.logging.logRequests}`);
    console.log(`  Log Cache:        ${this.config.logging.logCache}`);

    console.log('\n' + '─'.repeat(50) + '\n');
  }

  /**
   * Validate configuration values
   */
  validate() {
    const errors = [];

    if (this.config.cache.maxSize < 1) {
      errors.push('cache.maxSize must be at least 1');
    }

    if (this.config.cache.ttl < 1000) {
      errors.push('cache.ttl must be at least 1000ms (1 second)');
    }

    if (this.config.server.timeout < 1000) {
      errors.push('server.timeout must be at least 1000ms (1 second)');
    }

    if (this.config.server.maxRedirects < 0) {
      errors.push('server.maxRedirects must be non-negative');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

module.exports = new Config();
