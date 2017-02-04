'use strict';

const CONST = require('../../const');
const MONGO_URL = `mongodb://localhost:${CONST.MONGO_PORT}/${CONST.DB_NAME}`;

var client = require('mongodb').MongoClient;
var db = null;

module.exports = {
  getDB: function(cb) {
    if (db) {
      cb(null, db);
      return;
    }

    client.connect(MONGO_URL, (err, mongodb) => {
      if (err) {
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
