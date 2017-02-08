'use strict';

var Utility = require('./utility.js');

function ClientList() {
  this.clientCount = 0;
  this.byId = {};
  this.bySocket = new WeakMap();
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

ClientList.prototype.add = function(socket, clientId) {
  var client = this.get(socket);
  if (client) {
    console.log('trying to add socket that already exists', clientId);
    return client;
  }

  var socketId = Utility.guid();
  client = {
    socket: socket,
    socketId: socketId,
    clientId: clientId || Utility.guid(),
    name: this.generateName(), // TODO: get this from storage
    status: '',
  };
  this.byId[socketId] = client;
  this.bySocket.set(socket, client);

  return client;
};

ClientList.prototype.remove = function(socket) {
  var client = this.bySocket.get(socket);
  if (!client) {
    console.log('could not remove unreconized socket');
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

ClientList.prototype.setName = function(socketOrId, name) {
  var client = this.get(socketOrId);
  if (!client) {
    console.log('unable to set name of unreconized client', socketOrId);
    return false;
  }

  // TODO: Check that name doesn't already exist in database.
  client.name = name;
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
