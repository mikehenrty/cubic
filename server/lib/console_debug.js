'use strict';

var DEBUG = false;

console.debug = function() {
  if (DEBUG) {
    console.log.apply(console, arguments);
  }
};

console.setDebug = function(debug) {
  DEBUG = !!debug;
}

module.exports = console;
