'use strict'

var config = require('./config')

/**
 * Logging is done with Cedar, which gives us pretty colors as well as
 * code snippets in stack traces.
 *
 * The log method/object is added to the process object for convenience, to
 * avoid having to add a reference to the log module in files that only need
 * logging temporarily for debug purposes.
 *
 * TODO: Add an optional test which verifies that this is the only reference
 * to `process.log` when running tests in CI mode.
 */
module.exports = process.log = require('cedar')(config.logger)

/**
 * Show ASCII art, unless we're testing or in production.
 */
if (!config.isProduction) {
  var red = '\u001b[31m'
  var white = '\u001b[37m'
  var green = '\u001b[32m'
  var cyan = '\u001b[36m'
  var base = '\u001b[39m'
  var pkg = require('../package')
  var app = pkg.name + ' v' + pkg.version
  var node = 'node ' + process.version
  console.log('\n' +
    red + '###############' + base + '   ___                      \n' +
    red + '###' + white + '/d@@@@@@@b' + red + '##' + base + '  / __|___ _ ___ _____ _  _ \n' +
    red + '##' + white + '/@@@@@@@@@@' + red + '##' + base + ' | (__/ _ \\ \' \\ V / _ \\ || |\n' +
    red + '##' + white + '@@@/' + red + '#########' + base + '  \\___\\___/_||_\\_/\\___/\\_, |\n' +
    red + '##' + white + '@@@' + red + '##########' + base + '                       |__/ \n' +
    red + '##' + white + '@@@\\' + red + '#########  ' + base + app + '\n' +
    red + '##' + white + '\\@@@@@@@@@@' + red + '##  ' + green + node + '\n' +
    red + '###' + white + '\\q@@@@@@@p' + red + '##  ' + cyan + config.endpoint + base + '\n' +
    red + '###############' + base + '\n')
}
