'use strict'
/* global describe it before after */

// Support running with mocha, if that's your preference.
var is = global.is || require('exam/lib/is')

var helper = require('../helpers/helper')
helper.quiet()
var app = require('../../index')
helper.loud()
helper.wait()
var Offer = require('../../entities/offer')

describe('/offer', function () {
  before(function (done) {
    app.then(function () {
      done()
    })
  })
  after(function () {
    helper.unwait()
  })

  describe('PUT', function () {
    it('accepts an offer', function (done) {
      helper.request({
        method: 'POST',
        path: '/shipment',
        body: {capacity: 12}
      }, function (body) {
        var shipmentId = body.id
        var offers = body.offers
        is.greater(offers.length, 1)
        var offer = offers[0]
        var offerId = offer.offerId
        helper.request({
          method: 'PUT',
          path: '/offer/' + offerId,
          body: {status: 'ACCEPT'}
        }, function (body) {
          var sql = 'SELECT * FROM offer WHERE shipment_id = $1'
          helper.query(sql, [shipmentId], function (error, result) {
            is.falsy(error)
            var rows = result.rows
            is(rows.length, 1)
            var offer = new Offer(rows[0])
            is(offer.accepted, true)
            done()
          })
        })
      })

      it('passes on an offer', function (done) {
        helper.request({
          method: 'POST',
          path: '/shipment',
          body: {capacity: 12}
        }, function (body) {
          var offers = body.offers
          is.greater(offers.length, 1)
          var offer = offers[0]
          var offerId = offer.offerId
          helper.request({
            method: 'PUT',
            path: '/offer/' + offerId,
            body: {status: 'PASS'}
          }, function (body) {
            var sql = 'SELECT * FROM offer WHERE id = $1'
            helper.query(sql, [offerId], function (error, result) {
              is.falsy(error)
              var rows = result.rows
              is(rows.length, 0)
              done()
            })
          })
        })
      })
    })

    it('fails when status is not "ACCEPT" or "PASS"', function (done) {
      helper.request({
        method: 'PUT',
        path: '/offer/1234',
        body: {status: 'BOOM'}
      }, function (body) {
        is(body.error, 'Status must be "ACCEPT" or "PASS"')
        done()
      })
    })

    it('fails when an offer is already accepted', function (done) {
      helper.request({
        method: 'POST',
        path: '/shipment',
        body: {capacity: 12}
      }, function (body) {
        var offers = body.offers
        var offer1 = offers[0]
        var offer2 = offers[1]
        helper.request({
          method: 'PUT',
          path: '/offer/' + offer1.offerId,
          body: {status: 'ACCEPT'}
        }, function (body) {
          helper.request({
            method: 'PUT',
            path: '/offer/' + offer2.offerId,
            body: {status: 'ACCEPT'}
          }, function (body) {
            is(body.error, 'Not an Active Offer')
            done()
          })
        })
      })
    })
  })
})
