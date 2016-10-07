'use strict'

var fs = require('fs')
var Flagger = require('lighter-flagger')
var app = module.exports = new Flagger()
var server = require('./lib/server')
app.wait()
server.on('listening', function () {
  app.unwait()
})

fs.readdirSync('entities').forEach(function (filename) {
  require('./entities/' + filename)
})
