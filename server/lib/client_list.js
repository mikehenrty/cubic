'use strict';

var Utility = require('./utility.js');
var Users = require('./db/users.js');
var Reports = require('./db/reports.js');

function ClientList() {
  this.clientCount = 0;
  this.byId = {};
  this.bySocket = new WeakMap();
  this.reports = [];
}

ClientList.prototype.isId = function(thing) {
  return typeof thing === 'string';
};

ClientList.prototype.get = function(socketOrId) {
  return this.byId[socketOrId] || this.bySocket.get(socketOrId);
};

ClientList.prototype.getId = function(socket) {
  return this.get(socket).socketId;
};

ClientList.prototype.add = function(socket, clientId, cb) {
  var client = this.get(socket);
  if (client) {
    console.log('trying to add socket that already exists', clientId);
    if (cb) { cb(null, client); }
    return;
  }

  clientId = clientId || Utility.guid();
  var ip = socket.upgradeReq.headers['x-forwarded-for'] ||
           socket.upgradeReq.connection.remoteAddress;

  Users.get(clientId, ip, (err, result) => {
    if (err || !result) {
      console.error('could not fetch client', clientId, err);
    }

    result = result || {};
    var info = result.value;
    var client = {
      socket: socket,
      socketId: Utility.guid(),
      clientId: clientId,
      name: info.name || this.generateName(),
      status: '',
    };

    this.byId[client.socketId] = client;
    this.bySocket.set(socket, client);

    if (cb) { cb(err, client); }
  });

};

ClientList.prototype.remove = function(socket) {
  var client = this.bySocket.get(socket);
  if (!client) {
    console.log('could not remove unrecognized socket');
    return;
  }

  this.bySocket.delete(socket);
  delete this.byId[client.socketId];
};

ClientList.prototype.generateName = function() {
  return `Player_${++this.clientCount}`;
};

ClientList.prototype.getName = function(socketOrId) {
  var client = this.get(socketOrId);
  if (!client) {
    return '---';
  }

  return client.name;
};

ClientList.prototype.setName = function(socketOrId, name, cb) {
  var client = this.get(socketOrId);
  if (!client) {
    var msg = `unable to set name of unreconized client: ${socketOrId}`;
    console.error(msg);
    if (cb) { cb(new Error(msg)); }
    return false;
  }

  client.name = name;

  // Send DB update after we respond to request.
  Users.setName(client.clientId, name, (err) => {
    if (err) {
      console.error('db setname fail', err);
      if (cb) { cb(new Error('could not set name')); }
      return;
    }
    if (cb) { cb(null, client); }
  });

  return true;
};

ClientList.prototype.setStatus = function(socketOrId, status) {
  var client = this.get(socketOrId);
  if (!client) {
    console.log('could not set status of unreconized client', socketOrId);
    return false;
  }

  client.status = status;
  return true;
};

ClientList.prototype.getIdList = function() {
  return Object.keys(this.byId);
};

ClientList.prototype.getSocketList = function() {
  return this.getIdList().map(id => {
    return this.byId[id].socket;
  });
};

ClientList.prototype.getInfoList = function() {
  return this.getIdList().map(id => {
    return this.byId[id];
  });
};

ClientList.prototype.saveReport = function(socketOrId, report, cb) {
  var client = this.get(socketOrId);
  var matchingReport = this.reports[report.gameId];
  if (!matchingReport) {
    this.reports[report.gameId] = report;
  } else {
    delete this.reports[report.gameId];
    this.compareReports(report, matchingReport);
  }
  Reports.add(client.clientId, report, cb);
};

ClientList.prototype.compareReports = function(reportOne, reportTwo) {
  var matching = reportOne.log.every((itemOne, index) => {
    var itemTwo = reportTwo.log[index];
    return Object.keys(itemOne).every(key => {
      return itemOne[key] === itemTwo[key];
    });
  });

  if (!matching) {
    console.error('unmatching game reports', reportOne.log, reportTwo.log);
  }
};

ClientList.prototype.getListAsString = function() {
  return JSON.stringify(this.getIdList().map((id) => {
    var client = this.byId[id];
    return {
      socketId: client.socketId,
      clientId: client.clientId,
      clientName: client.name,
      clientStatus: client.status,
    };
  }));
};

ClientList.prototype.printList = function() {
  console.log('LIST:');
  this.getIdList().forEach(id => {
    console.log('--', this.byId[id].name, id.substr(0, id.indexOf('-')));
  });
  console.log('');
};

module.exports = ClientList;
