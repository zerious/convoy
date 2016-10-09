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
var server = require('../../lib/server')
var db = require('../../lib/db')

describe('/shipment', function () {
  before(function (done) {
    app.then(function () {
      done()
    })
  })
  after(function () {
    helper.unwait()
  })

  describe('POST', function () {
    it('creates a shipment', function (done) {
      var capacity = Math.ceil(Math.random() * 80)
      helper.request({
        method: 'POST',
        path: '/shipment',
        body: {capacity: capacity}
      }, function (body) {
        var offers = body.offers
        is.array(offers)
        is.truthy(offers[0].offerId)
        is.truthy(offers[0].driverId)
        var sql = 'SELECT * FROM shipment WHERE id = $1'
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
        path: '/shipment',
        body: {}
      }, function (body) {
        is.truthy(body.error)
        done()
      })
    })

    it('returns an error when failing to INSERT a shipment', function (done) {
      mock(db, {
        query: function (sql, values, fn) {
          fn(new Error('FAIL'))
        }
      })
      helper.request({
        method: 'POST',
        path: '/shipment',
        body: {capacity: 12}
      }, function (body) {
        is(body.error, 'FAIL')
        unmock(db)
        done()
      })
    })

    it('returns an error when failing to SELECT drivers', function (done) {
      mock(db, {
        query: function (sql, values, fn) {
          // Fake a new shipment.
          if (/INSERT INTO shipment/i.test(sql)) {
            fn(null, {rowCount: 1, rows: [{id: 1}]})
          // Fail to get drivers.
          } else {
            fn(new Error('FAIL'))
          }
        }
      })
      helper.request({
        method: 'POST',
        path: '/shipment',
        body: {capacity: 12}
      }, function (body) {
        is(body.error, 'FAIL')
        unmock(db)
        done()
      })
    })
  })

  describe('GET', function () {
    it('returns a shipment with its accepted offer', function (done) {
      helper.request({
        method: 'GET',
        path: '/shipment/1'
      }, function (body) {
        is(body.id, 1)
        var offer = body.offer
        is.number(offer.offerId)
        is.number(offer.driverId)
        done()
      })
    })

    it('returns a shipment with outstanding offers', function (done) {
      helper.request({
        method: 'GET',
        path: '/shipment/2'
      }, function (body) {
        is(body.id, 2)
        var offers = body.offers
        is.array(offers)
        var offer = offers[0]
        is.number(offer.offerId)
        is.number(offer.driverId)
        done()
      })
    })

    it('punts when the shipment does not exist', function (done) {
      helper.request({
        method: 'GET',
        path: '/shipment/' + 2e9
      }, function (body) {
        is(body.error, server.E_NOT_FOUND)
        done()
      })
    })

    it('punts when the id is out of range', function (done) {
      helper.request({
        method: 'GET',
        path: '/shipment/NaN'
      }, function (body) {
        is(body.error, server.E_NOT_FOUND)
        done()
      })
    })

    it('returns an error if offers failed to populate', function (done) {
      mock(db, {
        query: function (sql, values, fn) {
          // Make the DB return a fake shipment.
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
        path: '/shipment/1'
      }, function (body) {
        is(body.error, 'FAIL')
        unmock(db)
        done()
      })
    })
  })
})
