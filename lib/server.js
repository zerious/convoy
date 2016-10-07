'use strict'

var http = require('http')
var config = require('./config')
var log = require('./log')
var entities = {}
var pageNotFound = new Error('Page Not Found')

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
  response.fetch(function (data) {
    request.data = data
    entity.handle(request, response)
  })
}).listen(config.http.port)

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
  fail: function fail (error) {
    var json = JSON.stringify({error: error.message})
    this.status = (error === pageNotFound ? 404 : 500)
    this.end(json)
    log.error(error)
  },

  punt: function punt () {
    this.statusCode = 404
    this.json({'error': 'Not Found'})
  },

  json: function json (object) {
    var json = JSON.stringify(object)
    this.end(json)
  },

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
        this.fail(error)
      }
    })
  }
}
for (var key in fns) {
  http.IncomingMessage.prototype[key] = fns[key]
  http.ServerResponse.prototype[key] = fns[key]
}
