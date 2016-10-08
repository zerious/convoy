'use strict'

var Entity = require('../lib/entity')
var db = require('../lib/db')
var config = require('../lib/config')

module.exports = Entity.extend(

  // Constructor.
  function Shipment () {
    Entity.apply(this, arguments)
  },

  // Prototype properties.
  {
    accepted: false
  },

  // Constructor properties.
  {
    fields: {
      capacity: {
        type: 'number',
        required: true
      },
      accepted: {
        type: 'boolean',
        default: false
      }
    },

    sql: {
      drivers:
        'SELECT d.id, d.capacity ' +
        'FROM driver d LEFT OUTER JOIN offer o ON d.id = o.driver_id ' +
        'WHERE d.capacity >= $1 ' +
        'GROUP BY d.id ' +
        'ORDER BY COUNT(*), d.id ' +
        'LIMIT ' + config.shipment.maxOffers,
      populate: 'SELECT id o, driver_id d FROM offer ' +
        'WHERE shipment_id = $1 AND accepted = $2'
    },

    /**
     * Return a minimal representation of a newly-created shipment.
     *
     * @param  {Object} entity  A shipment.
     * @return {Object}         An object to return from the API.
     */
    formatForPost: function (entity) {
      return {
        id: entity.id,
        offers: entity.offers
      }
    },

    /**
     * Get outstanding offers (or the accepted offer) for a shipment.
     *
     * @param  {Object} entity  A shipment.
     * @return {Function}   fn  An errback function: `fn(error, data)`.
     */
    populateForGet: function (entity, fn) {
      var id = entity.id
      var accepted = entity.accepted
      db.query(this.sql.populate, [id, accepted], function (error, result) {
        var data = {id: id}
        if (!accepted) {
          data.offers = []
        }
        if (!error) {
          result.rows.forEach(function (offer) {
            offer = {
              offerId: offer.o,
              driverId: offer.d
            }
            if (accepted) {
              data.offer = offer
            } else {
              data.offers.push(offer)
            }
          })
        }
        fn(error, data)
      })
    },

    /**
     * Create a shipment and its offers.
     *
     * @param  {Object}   data  Entity data.
     * @param  {Function} fn    An errback function: `fn(error, result)`.
     */
    create: function (data, fn) {
      var self = this
      this._super.create.call(this, data, function (error, shipment) {
        if (error) {
          return fn(error)
        }
        db.query(self.sql.drivers, [shipment.capacity], function (error, result) {
          if (error) {
            return fn(error)
          }
          var tokens = []
          var values = []
          var drivers = result.rows
          var i = 0
          drivers.forEach(function (driver) {
            tokens.push('($' + (++i) + ', $' + (++i) + ', false)')
            values.push(shipment.id, driver.id)
          })
          var sql = 'INSERT INTO offer (shipment_id, driver_id, accepted) ' +
            'VALUES ' + tokens.join(', ') + ' RETURNING id AS o, driver_id AS d'
          db.query(sql, values, function (error, result) {
            var offers = shipment.offers = []
            result.rows.forEach(function (row, i) {
              offers.push({
                offerId: row.o,
                driverId: row.d
              })
            })
            fn(error, shipment)
          })
        })
      })
    }
  }
)
