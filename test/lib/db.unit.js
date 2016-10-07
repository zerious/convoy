'use strict'
/* global describe it */

// Support running with mocha, if that's your preference.
var is = global.is || require('exam/lib/is')
var mock = global.mock || require('exam/lib/mock')
var unmock = mock.unmock

// var pg = require('pg')
var db = require('../../lib/db')
var log = require('../../lib/log')

describe('db', function () {
  describe('.query', function () {
    it('fails if unable to connect to the pool', function (done) {
      mock(log, {
        error: mock.args()
      })
      mock(db.pool, {
        connect: function (fn) {
          fn(new Error('Connection failed.'))
        }
      })
      db.query('SELECT * FROM offer', [], function (error, result) {
        is.error(error)
        is(error, log.error.value[0][0])
        unmock(log)
        unmock(db.pool)
        done()
      })
    })
  })
})
