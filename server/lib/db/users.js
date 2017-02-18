'use strict';

const USERS = 'users';

var ff = require('ff');
var mongo = require('./mongo');

module.exports = {
  get: function(clientId, ip, cb) {
    var db;

    var f = ff(() => {
      mongo.getDB(f());
    },

    _db => {
      db = _db;
      db.collection(USERS).findOneAndUpdate(
        { clientId: clientId },
        {
          $setOnInsert: {
            clientId: clientId,
            name: '',
            joined: new Date(),
            plays: 0,
            wins: 0,
            moves: 0,
            avgLatency: mongo.Double(0),
          },
          $set: {
            updated: new Date(),
          },
          $inc: { registers: 1 },
          $addToSet: { ips: ip },
        },
        { upsert: true, returnOriginal: false}, f());
    });

    f.onComplete(cb);
  },

  setName: function(clientId, name, cb) {
    var f = ff(() => {
      mongo.getDB(f());
    },

    db => {
      db.collection(USERS).findOneAndUpdate(
        { clientId: clientId },
        { $set : { name: name } },
        { returnOriginal: false}, f());
    }).onComplete(cb);
  },

  create: function(cb) {
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
          { 'registers': { '$type': 'int' } },
          { 'plays': { '$type': 'int' } },
          { 'wins': { '$type': 'int' } },
          { 'moves': { '$type': 'int' } },
          { 'avgLatency': { '$type': 'double' } },
          // Validate that ips is an array (workaround).
          // See: https://jira.mongodb.org/browse/SERVER-23912
          { 'ips.0': { '$exists': true } },
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

  destroy: function(cb) {
    var f = ff(() => {
      mongo.getDB(f());
    },

    db => {
      db.collection(USERS).drop(f());
    });

    f.onComplete(cb);
  },
};

