'use strict'
/* global describe it */

// Support running with mocha, if that's your preference.
var is = global.is || require('exam/lib/is')
var mock = global.mock || require('exam/lib/mock')
var unmock = mock.unmock

require('../helpers/helper')
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
          fn(new Error('FAIL'))
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

  describe('client', function () {
    it('logs an error if .end fails', function (done) {
      var empty = []
      mock(log, {
        error: function () {
          unmock(log)
          unmock(db.pool)
          done()
        }
      })
      mock(db.pool, {
        connect: function (fn) {
          fn(null, {
            query: function (sql, values, fn) {
              fn(null, {rows: empty})
            },
            end: function (fn) {
              fn(new Error('FAIL'))
            }
          })
        }
      })
      db.query('SELECT * FROM offer', [], function (ignore, result) {
        is(result.rows, empty)
      })
    })
  })
})
