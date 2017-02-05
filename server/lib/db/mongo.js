'use strict';

const CONST = require('../../const');

const USER = CONST.DB_USER;
const PASS = CONST.DB_PASSWORD;
const PORT = CONST.MONGO_PORT;
const NAME = CONST.DB_NAME;

const MONGO_URL = `mongodb://${USER}:${PASS}@localhost:${PORT}/${NAME}`;

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
    if (db) { db.close(); }
  },
};
