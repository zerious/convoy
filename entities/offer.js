'use strict'

var Entity = require('../lib/entity')
var db = require('../lib/db')
var server = require('../lib/server')

var Offer = module.exports = Entity.extend(

  // Constructor.
  function Offer () {
    Entity.apply(this, arguments)
  },

  // Prototype properties.
  {},

  // Constructor properties.
  {
    fields: {
      shipmentId: {
        type: 'id'
      },
      driverId: {
        type: 'id'
      }
    },

    sql: {
      acceptShipment: 'UPDATE shipment SET accepted = true ' +
        'WHERE id = $1 AND accepted = false',
      acceptOffer: 'UPDATE offer SET accepted = true ' +
        'WHERE id = $1',
      cull: 'DELETE FROM offer ' +
        'WHERE shipment_id = $1 AND id != $2 AND accepted = false',
      pass: 'DELETE FROM offer ' +
        'WHERE id = $1 AND accepted = false'
    },

    handlePost: server.punt,

    handlePut: function handlePut (request, response) {
      var self = this
      var id = request.id
      var data = request.data
      switch (data.status.toUpperCase()) {

        case 'ACCEPT':
          db.query(self.sql.get, [id], function (error, result) {
            if (error || !result.rows.length) {
              return response.fail(error || new Error('Not an Active Offer'))
            }
            var offer = new Offer(result.rows[0])
            var shipmentId = offer.shipmentId
            db.query(self.sql.acceptShipment, [shipmentId], function (error, result) {
              if (error || !result.rowCount) {
                return response.fail(error || new Error('Not an Active Offer'))
              }
              var remaining = 2
              db.query(self.sql.acceptOffer, [id], function (newError, result) {
                error = error || newError
                if (!--remaining) {
                  done()
                }
              })
              db.query(self.sql.cull, [shipmentId, id], function (newError, result) {
                error = error || newError
                if (!--remaining) {
                  done()
                }
              })
              function done () {
                if (error) {
                  return response.fail(error)
                }
                response.json({})
              }
            })
          })
          break

        case 'PASS':
          db.query(self.sql.pass, [id], function (error, result) {
            if (error || !result.rowCount) {
              return response.fail(error || new Error('Not an Active Offer'))
            }
            response.json({})
          })
          break

        default:
          response.fail(new Error('Status must be "ACCEPT" or "PASS"'))
      }
    },

    handleGet: server.punt
  }
)
