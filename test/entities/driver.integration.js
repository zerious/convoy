'use strict'
/* global describe it before after */

// Support running with mocha, if that's your preference.
var is = global.is || require('exam/lib/is')
var mock = global.mock || require('exam/lib/mock')
var unmock = mock.unmock

var helper = require('../helpers/helper')
helper.quiet()
var app = require('../../index')
helper.loud()
helper.wait()
var driver = require('../../entities/driver')
var server = require('../../lib/server')
var db = require('../../lib/db')

describe('/driver', function () {
  before(function (done) {
    app.then(function () {
      done()
    })
  })
  after(function () {
    helper.unwait()
  })

  describe('POST', function () {
    it('creates a driver', function (done) {
      var capacity = Math.ceil(Math.random() * 100)
      helper.request({
        method: 'POST',
        path: '/driver',
        body: {capacity: capacity}
      }, function (body) {
        var sql = 'SELECT * FROM driver WHERE id = $1'
        helper.query(sql, [body.id], function (error, result) {
          is.falsy(error)
          var row = result.rows[0]
          is(row.id, body.id)
          is(row.capacity, capacity)
          done()
        })
      })
    })

    it('fails when capacity is omitted', function (done) {
      helper.request({
        method: 'POST',
        path: '/driver',
        body: {}
      }, function (body) {
        is.truthy(body.error)
        done()
      })
    })
  })

  describe('GET', function () {
    it('returns a driver', function (done) {
      helper.request({
        method: 'GET',
        path: '/driver/1'
      }, function (body) {
        is(body.id, 1)
        var offers = body.offers
        is.array(offers)
        var offer = offers[0]
        is.object(offer)
        is.number(offer.offerId)
        is.number(offer.shipmentId)
        done()
      })
    })

    it('punts when the driver does not exist', function (done) {
      helper.request({
        method: 'GET',
        path: '/driver/' + 2e9
      }, function (body) {
        is(body.error, server.E_NOT_FOUND)
        done()
      })
    })

    it('punts when the id is out of range', function (done) {
      helper.request({
        method: 'GET',
        path: '/driver/NaN'
      }, function (body) {
        is(body.error, server.E_NOT_FOUND)
        done()
      })
    })

    it('returns an error if offers failed to populate', function (done) {
      mock(db, {
        query: function (sql, values, fn) {
          // Make the DB return a fake driver.
          if (!/offer/i.test(sql)) {
            fn(null, {rows: [{
              id: 1,
              accepted: false
            }]})
          // Fail when trying to SELECT offers.
          } else {
            fn(new Error('FAIL'))
          }
        }
      })
      helper.request({
        method: 'GET',
        path: '/driver/1'
      }, function (body) {
        is(body.error, 'FAIL')
        unmock(db)
        done()
      })
    })

    it('does not allow SQL injection', function (done) {
      helper.request({
        method: 'POST',
        path: '/driver',
        body: {capacity: '1);DROP TABLE driver;INSERT INTO shipment (accepted, capacity) VALUES (false, 2'}
      }, function (body) {
        is(body.error, '"capacity" must be a number.')
        var sql = 'SELECT COUNT(*) FROM driver'
        helper.query(sql, [], function (error, result) {
          is.falsy(error)
          done()
        })
      })
    })

    it('would not allow SQL injection even if validation was omitted', function (done) {
      mock(driver, {
        validate: function (object, fn) {
          fn()
        }
      })
      helper.request({
        method: 'POST',
        path: '/driver',
        body: {capacity: '1);DROP TABLE driver;INSERT INTO shipment (accepted, capacity) VALUES (false, 2'}
      }, function (body) {
        is.in(body.error, 'invalid input syntax for type double precision')
        var sql = 'SELECT COUNT(*) FROM driver'
        helper.query(sql, [], function (error, result) {
          is.falsy(error)
          unmock(driver)
          done()
        })
      })
    })

    it('would not allow SQL injection even if validation was omitted and single quotes were used', function (done) {
      mock(driver, {
        validate: function (object, fn) {
          fn()
        }
      })
      helper.request({
        method: 'POST',
        path: '/driver',
        body: {capacity: "1');DROP TABLE driver;INSERT INTO shipment (accepted, capacity) VALUES (false, '2"}
      }, function (body) {
        is.in(body.error, 'invalid input syntax for type double precision')
        var sql = 'SELECT COUNT(*) FROM driver'
        helper.query(sql, [], function (error, result) {
          is.falsy(error)
          unmock(driver)
          done()
        })
      })
    })
  })
})
