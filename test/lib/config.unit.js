'use strict'
/* global describe it */

// Support running with mocha, if that's your preference.
var is = global.is || require('exam/lib/is')

var config = require('../../lib/config')

describe('config', function () {
  describe('.isTest', function () {
    it('is false if global.describe does not exist', function () {
      var path = require.resolve('../../lib/config')
      delete require.cache[path]
      var describe = global.describe
      delete global.describe
      require('../../lib/config')
      is.false(config.isTest)
      global.describe = describe
      delete require.cache[path]
      require('../../lib/config')
    })
  })
})
