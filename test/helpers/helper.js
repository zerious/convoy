'use strict'

// Support running with mocha, if that's your preference.
var mock = global.mock || require('exam/lib/mock')

// Load the logger, making sure that it doesn't write ASCII art to console.
mock(console, {log: mock.count()})
var log = require('../../lib/log')
mock.unmock(console)

var config = require('../../lib/config')
var db = require('../../lib/db')
var server = require('../../lib/server')
var http = require('http')
var Flagger = require('lighter-flagger')

var self = module.exports = new Flagger()

/**
 * Make an HTTP request to the API, and parse its JSON response.
 *
 * @param  {Object}   options  HTTP request options.
 *                             NOTE: hostname and port are set automagically.
 * @param  {Function} fn       Callback which will accept a data object.
 */
self.request = function (options, fn) {
  options.hostname = config.http.hostname
  options.port = config.http.port
  var json = JSON.stringify(options.body)
  self.quiet()
  http.request(options, function (response) {
    response.fetch(function (data) {
      self.loud()
      fn(data)
    })
  }).end(json)
}

/**
 * Disable Cedar logging temporarily (to keep tests from making noise).
 */
self.quiet = function () {
  mock(log, {
    log: mock.count(),
    info: mock.count(),
    warn: mock.count(),
    error: mock.count()
  })
}

/**
 * Re-enable Cedar logging.
 */
self.loud = function () {
  mock.unmock(log)
}

// Expose the DB module's query method.
self.query = db.query

// Once the helper is done helping, kill the HTTP server so that subsequent
// test runs in watch mode will not get EADDRINUSE errors.
setTimeout(function () {
  self.then(function () {
    server.close()
  })
}, 1)
