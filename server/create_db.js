'use strict';

var mongo = require('./lib/db/mongo');
var Users = require('./lib/db/users');
var Reports = require('./lib/db/reports');

var ff = require('ff');

function run(cb) {
  var f = ff(() => {
    mongo.getDB(f());
  }, () => {
    Users.create(f());
    Reports.create(f());
  });

  f.onComplete((err) => {
    if (err) { console.error('could not create db', err); }
    mongo.disconnect();
    if (cb) { cb(); }
  });
}

// If this was run from cli, immediately invoke run.
if (require.main === module) {
  run();
} else {
  module.exports = run;
}
