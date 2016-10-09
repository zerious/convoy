'use strict'
/* global describe it */

// Support running with mocha, if that's your preference.
var is = global.is || require('exam/lib/is')
var mock = global.mock || require('exam/lib/mock')
var unmock = mock.unmock

var config = require('../../lib/config')

describe('log', function () {
  it('outputs ASCII art when not in test/production mode', function (done) {
    var path = require.resolve('../../lib/log')
    delete require.cache[path]
    mock(console, {
      log: function (value) {
        is.in(value, '@@@')
        unmock(console)
        config.isTest = true
        done()
      }
    })
    config.isTest = false
    require('../../lib/log')
  })
})
