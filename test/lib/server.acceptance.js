'use strict'
/* global describe it */

// Support running with mocha, if that's your preference.
var is = global.is || require('exam/lib/is')
var mock = global.mock || require('exam/lib/mock')
var unmock = mock.unmock

var http = require('http')
var helper = require('../helpers/helper')
helper.quiet()
require('../../index')
helper.loud()
helper.wait()
var server = require('../../lib/server')
var config = require('../../lib/config')
var log = require('../../lib/log')

describe('server', function () {
  it('punts when there is no matching entity', function (done) {
    helper.request({
      method: 'GET',
      path: '/'
    }, function (body) {
      is(body.error, server.E_NOT_FOUND)
      done()
    })
  })

  it('punts when an entity does not support the method', function (done) {
    helper.request({
      method: 'PUT',
      path: '/driver',
      body: {}
    }, function (body) {
      is(body.error, server.E_NOT_FOUND)
      done()
    })
  })

  it('outputs pretty JSON when the client accepts HTML', function (done) {
    helper.quiet()
    http.get({
      hostname: config.http.hostname,
      port: config.http.port,
      path: '/',
      headers: {
        accept: 'text/html'
      }
    }, function (response) {
      var data = ''
      response.on('data', function (chunk) {
        data += chunk
      })
      response.on('end', function () {
        is.in(data, '  ')
        is.in(data, server.E_NOT_FOUND)
        helper.loud()
        done()
      })
    })
  })

  it('warns when invalid JSON is received', function (done) {
    helper.quiet()
    mock(log, {
      warn: mock.count()
    })
    http.request({
      method: 'POST',
      hostname: config.http.hostname,
      port: config.http.port,
      path: '/driver'
    }, function (response) {
      response.fetch(function (body) {
        is.truthy(body.error)
        is(log.warn.value, 1)
        helper.loud()
        unmock(log)
        done()
      })
    }).end('This is not JSON.')
  })
})
