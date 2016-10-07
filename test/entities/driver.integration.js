'use strict'
/* global describe it before after */

// Support running with mocha, if that's your preference.
var is = global.is || require('exam/lib/is')

var helper = require('../helpers/helper')
helper.quiet()
var app = require('../../index')
helper.loud()
helper.wait()

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
        is(body.error, 'Not Found')
        done()
      })
    })

    it('punts when the id is out of range', function (done) {
      helper.request({
        method: 'GET',
        path: '/driver/NaN'
      }, function (body) {
        is(body.error, 'Not Found')
        done()
      })
    })
  })
})
