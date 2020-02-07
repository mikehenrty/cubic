'use strict';

const REPORTS = 'reports';

var ff = require('ff');
var mongo = require('./mongo');

module.exports = {

  add: function(clientId, report, cb) {
    report.clientId = clientId;
    report.timestamp = new Date();

    var f = ff(() => {
      mongo.getDB(f());
    },

    db => {
      db.collection(REPORTS).insertOne(report, f.wait());
    });

    f.onComplete(cb);
  },

  create: function(cb) {
    var f = ff(() => {
      mongo.getDB(f());
    },

    db => {
      db.createCollection(REPORTS, f.wait());
      f.pass(db);
    },

    db => {
      db.command({
        collMod: REPORTS,
        'validator': { '$and': [
          { 'clientId': { '$type': 'string' } },
          { 'gameId': { '$type': 'string' } },
          { 'playerOne': { '$type': 'string' } },
          { 'playerTwo': { '$type': 'string' } },
          { 'playerNumber': { '$type': 'int' } },
          { 'moves': { '$type': 'int' } },
          { 'log': { '$type': 'object' } },
          { 'timestamp': { '$type': 'date' } },
        ]}
      }, f.wait());
      f.pass(db);
    },

    db => {
      db.collection(REPORTS).createIndex(
        {
          clientId: 'text',
          gameId: 'text',
          playerOne: 'text',
          playerTwo: 'text',
        },
        f.wait());
    });

    f.onComplete(cb);
  },
};
