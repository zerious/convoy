'use strict'

/**
 * Configuration is loaded via `lighter-config`, which uses "config/base.json"
 * and applies overrides from "config/[NODE_ENV].json".
 */
var config = module.exports = require('lighter-config')

// Assemble an endpoint URL.
var http = config.http
config.endpoint = http.protocol + '://' + http.hostname + ':' + http.port

// Detect whether we're running inside a test suite (via `exam` or `mocha`).
config.isTest = !!global.describe

// If running in a test suite, use a different port in case we're also serving.
if (config.isTest) {
  http.port = 2e4 + process.pid % 1e4
}
