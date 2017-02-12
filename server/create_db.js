'use strict';

var mongo = require('./lib/db/mongo');
var Users = require('./lib/db/users');

function run(cb) {
  Users.destroy(() => {
    Users.create(err => {
      mongo.disconnect();
      if (cb) { cb(err); }
    });
  });
}

// If this was run from cli, immediately invoke run.
if (require.main === module) {
  run(err => {
    if (err) { console.error('could not create db', err); }
  });
} else {
  module.exports = run;
}
