'use strict'

var Type = require('lighter-type')
var db = require('./db')
var log = require('./log')
var server = require('./server')

/**
 * The Entity type is used as a combination of model and controller, allowing
 * for an API which can query data and apply business logic without using
 * multiple files for each type of data it handles.
 *
 * The Entity constructor (and constructors which extend Entity) can
 * instantiate new objects corresponding to database table rows, and the
 * Entity constructor's properties (i.e. static methods) are used for handling
 * requests and manipulating data.
 */
module.exports = Type.extend(

  // Constructor.
  function Entity (data) {
    var columns = this.constructor.columns
    for (var name in data) {
      var value = data[name]
      var field = columns[name]
      name = field ? field.name : name
      this[name] = value
    }
  },

  // Prototype properties.
  {},

  // Constructor properties.
  {
    /**
     * When an Entity Type is created, initialize it:
     *  - Register its routes.
     *  - Prepare SQL statements.
     */
    extend: function extend () {
      var self = this._super.extend.apply(this, arguments)
      server.register(self.name, self)
      self.prepare()
      log.info('Loaded "' + self.name + '" entity.')
      return self
    },

    /**
     * Prepare SQL statements for getting records and for creating records.
     */
    prepare: function prepare () {
      var sql = this.sql = this.sql || {}
      var columns = []
      var tokens = []
      var fields = this.fields
      var i = 0
      this.columns = {}
      for (var name in fields) {
        var field = fields[name]
        var column = name.replace(/([a-z])([A-Z])/g, function (match, lo, hi) {
          return lo + '_' + hi.toLowerCase()
        })
        field.column = column
        field.name = name
        columns.push(column)
        tokens.push('$' + (++i))
        this.columns[column] = field
      }
      sql.get = 'SELECT * FROM ' + this.name + ' WHERE id = $1'
      sql.create = 'INSERT INTO ' +
        this.name + ' (' + columns.join(', ') + ') ' +
        'VALUES (' + tokens.join(', ') + ') RETURNING id'
    },

    /**
     * Handle a request by routing it to the proper handler based on the
     * request method.
     *
     * @param  {Obect} request   An HTTP request.
     * @param  {Obect} response  An HTTP response.
     */
    handle: function handle (request, response) {
      var self = this
      switch (request.method) {
        case 'POST':
          self.handlePost(request, response)
          break
        case 'PUT':
          self.handlePut(request, response)
          break
        case 'GET':
          self.handleGet(request, response)
          break
      }
    },

    /**
     * Handle a POST request.
     *
     * @param  {Obect} request   An HTTP request.
     * @param  {Obect} response  An HTTP response.
     */
    handlePost: function handlePost (request, response) {
      var self = this
      var data = request.data
      self.validate(data, function (error) {
        if (error) {
          return response.fail(error)
        }
        self.create(data, function (error, entity) {
          if (error) {
            return response.fail(error)
          }
          var object = self.formatForPost(entity)
          response.json(object)
        })
      })
    },

    /**
     * Respond to POST requests with a minimal amount of data.
     *
     * @param  {Object} entity  Entity data.
     * @return {Object}         Response data.
     */
    formatForPost: function (entity) {
      return {id: entity.id}
    },

    // Respond with a 404 for sub-types that don't override this method.
    handlePut: server.punt,

    /**
     * Handle a GET request.
     *
     * @param  {Obect} request   An HTTP request.
     * @param  {Obect} response  An HTTP response.
     */
    handleGet: function handleGet (request, response) {
      var self = this
      db.query(self.sql.get, [request.id], function (error, result) {
        if (error || !result.rows.length) {
          return response.punt()
        }
        var row = result.rows[0]
        self.populateForGet(row, function (error, data) {
          if (error) {
            return response.fail(error)
          }
          response.json(data)
        })
      })
    },

    /**
     * Create an entity instance in the database.
     *
     * @param  {Object}   data  Entity data.
     * @param  {Function} fn    An errback function: `fn(error, result)`.
     */
    create: function (data, fn) {
      var self = this
      var entity = new this(data)
      var values = []
      var fields = self.fields
      for (var name in fields) {
        var value = entity[name] || fields[name].default
        values.push(value)
      }
      db.query(self.sql.create, values, function (error, result) {
        if (error) {
          return fn(error)
        }
        var row = result.rows[0]
        entity.id = row.id
        fn(null, entity)
      })
    },

    /**
     * Check to see if an object is valid as an entity instance.
     *
     * @param  {Object}   object  Object to validate as an entity instance.
     * @param  {Function} fn      Errback function which receives an error if
     *                            the object is not valid.
     */
    validate: function (object, fn) {
      var self = this
      var fields = self.fields
      for (var name in fields) {
        var field = fields[name]
        var value = object[name]
        var required = field.required
        if (required || value) {
          var rule = required ? 'must be' : 'should be'
          switch (field.type) {
            case 'number':
              if (isNaN(+value)) {
                return fn(new Error('"' + name + '" ' + rule + ' a number.'))
              }
          }
        }
      }
      fn()
    }
  }
)
