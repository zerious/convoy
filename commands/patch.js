'use strict'

/**
 * Database Patch Runner
 *
 * TODO: Don't blow away existing tables.
 */

var fs = require('fs')
var db = require('../lib/db')
var log = require('../lib/log')
var plans = require('plans')
var list = []

// Get all of the SQL statements from patch files.
fs.readdirSync('patches').forEach(function (filename) {
  var path = 'patches/' + filename
  var content = fs.readFileSync(path, 'utf8')
  var statements = content.replace(/(^|\n)\s*--[^\n]+\n/g, '\n').split(';')
  statements.forEach(function (sql) {
    sql = sql.replace(/\s+/g, ' ').trim()
    if (sql) {
      list.push(sql)
    }
  })
})

// Run each SQL statement in series.
plans
  .list(list)
  .each(function (sql, done) {
    log(sql)
    db.query(sql, [], function (error, data) {
      if (error) {
        error.message += '\n' + 'SQL: ' + sql
        log.error(error)
      }
      done()
    })
  }, {
    ok: function () {
      log.info('Success! :)\n')
    },
    fail: function () {
      log.error('Failed! :(\n')
    },
    done: function () {
      process.exit()
    }
  })
