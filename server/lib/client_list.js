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

// TODO: Fix this function or remove it in favor of get.
ClientList.prototype.exists = function(socketOrId) {
  return this.bySocket.has(socketOrId) || !!this.byId[socketOrId];
};

ClientList.prototype.get = function(socketOrId) {
  return this.byId[socketOrId] || this.bySocket.get(socketOrId);
};

ClientList.prototype.getId = function(socket) {
  return this.get(socket).socketId;
};

ClientList.prototype.add = function(socket, clientId) {
  if (this.exists(socket)) {
    console.log('trying to add socket that already exists', clientId);
    return this.get(socket);
  }

  var socketId = Utility.guid();
  var client = {
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
  if (!this.exists(socket)) {
    console.log('could not remove unreconized socket');
    return;
  }

  var client = this.bySocket.get(socket);
  this.bySocket.delete(socket);
  delete this.byId[client.socketId];
};

ClientList.prototype.send = function(recipient, message) {
  if (!this.exists(recipient)) {
    console.log('unable to send to unrecognized recipient', recipient);
    return;
  }

  this.get(recipient).socket.send(message);
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
  if (!this.exists(socketOrId)) {
    console.log('unable to set name of unreconized client', socketOrId);
    return false;
  }

  // TODO: Check that name doesn't already exist in database.
  this.get(socketOrId).name = name;
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
