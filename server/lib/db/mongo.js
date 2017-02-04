'use strict';

const CONST = require('../../const');

var client = require('mongodb').MongoClient;
var db = null;

module.exports = {
  getDB: function(cb) {
    if (db) {
      cb(null, db);
      return;
    }

    client.connect(CONST.MONGO_URL, (err, mongodb) => {
      if (err) {
        console.error('could not connect to db', err)
        cb(err);
        return;
      }

      db = mongodb;
      cb(null, db);
    });
  },

  disconnect: function() {
    db && db.close();
  },
}
