#!/usr/bin/env node

/**
 * 
 * CLI Interface

 * Parse command-line arguments using yargs
 * Handle --port, --origin, --clear-cache flags
 * Start the server or clear cache based on arguments
 */
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const ProxyServer = require('./server');
const cache = require('./cache');

// Parse command line arguments using yargs
// hideBin removes the first two arguments (node path and script path)
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options]')
  .example('$0 --port 3000 --origin http://dummyjson.com', 'Start proxy server')
  .example('$0 --clear-cache', 'Clear the cache')
  // Define the --port option
  .option('port', {
    alias: 'p',
    type: 'number',
    description: 'Port number for the proxy server',
    requiresArg: true,
  })
  // Define the --origin option
  .option('origin', {
    alias: 'o',
    type: 'string',
    description: 'Origin server URL to proxy requests to',
    requiresArg: true,
  })
  // Define the --clear-cache option
  .option('clear-cache', {
    alias: 'c',
    type: 'boolean',
    description: 'Clear the cache and exit',
    default: false,
  })
  // Custom validation
  .check((argv) => {
    // If --clear-cache is provided, we don't need other options
    if (argv['clear-cache']) {
      return true;
    }

    // Otherwise, both --port and --origin are required
    if (!argv.port) {
      throw new Error('Missing required argument: --port');
    }

    if (!argv.origin) {
      throw new Error('Missing required argument: --origin');
    }

    // Validate port number
    if (argv.port < 1 || argv.port > 65535) {
      throw new Error('Port must be between 1 and 65535');
    }

    // Validate origin URL format
    try {
      new URL(argv.origin);
    } catch (e) {
      throw new Error(
        'Invalid origin URL format. Must include protocol (http:// or https://)',
      );
    }

    return true;
  })
  .help('h')
  .alias('h', 'help')
  .version('1.0.0')
  .alias('v', 'version').argv;
