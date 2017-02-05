'use strict';

const USERS = 'users';

var ff = require('ff');
var mongo = require('./mongo');

module.exports = {
  create: function(cb) {
    var db;

    var f = ff(() => {
      mongo.getDB(f());
    },

    db => {
      db.createCollection(USERS, f.wait());
      f.pass(db);
    },

    db => {
      db.command({
        collMod: USERS,
        'validator': { '$and': [
          { 'clientId': { '$type': 'string' } },
          { 'name': { '$type': 'string' } },
          { 'joined': { '$type': 'date' } },
          { 'updated': { '$type': 'date' } },
          { 'played': { '$type': 'int' } },
          { 'won': { '$type': 'int' } },
          { 'moves': { '$type': 'int' } },
          { 'avgLatency': { '$type': 'int' } },
          { 'ips': { '$type': 'array' } },
        ]}
      }, f.wait());
      f.pass(db);
    },

    db => {
      db.collection(USERS).createIndex(
        { clientId: 'text', name: 'text' },
        { unique: true }, f.wait());
    });

    f.onComplete(cb);
  },
};

