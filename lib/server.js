'use strict'

var http = require('http')
var config = require('./config')
var log = require('./log')
var entities = {}

/**
 * The server module creates an HTTP server and exports it. This server uses
 * a simple routing model which accepts a `name` and `entity` for each
 * top-level route such as "/driver/*" or "/shipment/*".
 */
var self = module.exports = http.createServer(function handle (request, response) {
  // Log the request URL.
  log(request.method + ' ' + request.url)

  // Break the URL into its slash-delimited parts.
  var parts = request.url.split('/')

  // Store the ID in the case of URLs like "/driver/1234".
  request.id = (parts[2] || '').replace(/[^\d]+/g, '')

  // Everything returned by this API will be JSON.
  response.setHeader('Content-type', 'application/json')

  // If called from a browser, let's make the JSON pretty.
  if (/html/.test(request.headers.accept)) {
    response.pretty = true
  }

  // If there's no registered entity for this route, respond with 404.
  var name = parts[1]
  var entity = entities[name]
  if (!entity) {
    return response.punt()
  }

  // Handle GET requests immediately.
  if (request.method === 'GET') {
    return entity.handle(request, response)
  }

  // Handle POST and PUT requests after getting data from the body JSON.
  request.fetch(function (data) {
    request.data = data
    entity.handle(request, response)
  })
}).listen(config.http.port)

self.E_NOT_FOUND = 'Not Found'

/**
 * Register an entity which handles routes (past the top level).
 *
 * @param  {String} name    Name of the top-level URL in the URL
 *                          (e.g. "driver" for handling "/driver/*").
 * @param  {Object} entity  An object with `object.handle(request, response)`.
 */
self.register = function register (name, entity) {
  var route = name.toLowerCase()
  entities[route] = entity
}

/**
 * Send a 404 response.
 *
 * @param  {Object} request   An HTTP request.
 * @param  {Object} response  An HTTP response.
 */
self.punt = function punt (request, response) {
  response.punt()
}

/**
 * Decorate the HTTP request and response prototypes with helper methods.
 */
var fns = {

  /**
   * Send an error message, and log it.
   *
   * @param  {Object} error  The error message to send and log.
   */
  fail: function fail (error) {
    this.statusCode = (error.message === self.E_NOT_FOUND ? 404 : 500)
    this.json({error: error.message})
    switch (error.level) {
      case 'warn':
        log.warn(error)
        break
      default:
        log.error(error)
    }
  },

  /**
   * Send a 404 response.
   */
  punt: function punt () {
    var error = new Error(self.E_NOT_FOUND)
    error.level = 'warn'
    this.fail(error)
  },

  /**
   * Send the response as JSON.
   *
   * @param  {Object} object  The object to stringify and send.
   */
  json: function json (object) {
    var spaces = this.pretty ? '  ' : ''
    var json = JSON.stringify(object, undefined, spaces)
    this.end(json)
  },

  /**
   * Fetch data from a request.
   *
   * @param  {Function} fn  A callback to receive data: `fn(data)`
   */
  fetch: function fetch (fn) {
    var data = ''
    this.on('data', function (chunk) {
      data += chunk
    })
    this.on('end', function () {
      try {
        data = JSON.parse(data)
        fn(data)
      } catch (error) {
        error.message += '\nJSON: ' + data
        log.warn(error)
        fn({})
      }
    })
  }
}
for (var key in fns) {
  http.IncomingMessage.prototype[key] = fns[key]
  http.ServerResponse.prototype[key] = fns[key]
}
