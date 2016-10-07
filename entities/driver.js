'use strict'

var Entity = require('../lib/entity')
var db = require('../lib/db')

module.exports = Entity.extend(

  // Constructor.
  function Driver () {
    Entity.apply(this, arguments)
  },

  // Prototype properties.
  {},

  // Constructor properties.
  {
    fields: {
      capacity: {
        type: 'number',
        required: true
      }
    },

    sql: {
      populate: 'SELECT id o, shipment_id s FROM offer ' +
        'WHERE driver_id = $1 AND accepted = false'
    },

    /**
     * Populate a driver object with its array of outstanding offers.
     *
     * @param  {Object}   entity  A driver object.
     * @param  {Function} fn      Errback function: `fn(error, result)`.
     */
    populateForGet: function (entity, fn) {
      db.query(this.sql.populate, [entity.id], function (error, result) {
        var data = {id: entity.id}
        var offers = data.offers = []
        if (!error) {
          result.rows.forEach(function (offer) {
            offers.push({
              offerId: offer.o,
              shipmentId: offer.s
            })
          })
        }
        fn(error, data)
      })
    }
  }
)
