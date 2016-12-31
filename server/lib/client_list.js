'use strict';

var Utility = require('./utility.js');

var clientCount = 0;

function Client(name) {
  this.id = Utility.guid();
  this.name = name;
}

function ClientList() {
  this.clientCount = 0;
  this.clientInfo = {};
  this.clientIds = {};
}

ClientList.prototype.exists = function(clientId) {
  return !!this.clientInfo[clientId];
};

ClientList.prototype.add = function(socket, name) {
  var newName = this.isEligibleName(name) ?
    name : this.generateName();
  var newClient = new Client(newName);

  this.clientInfo[newClient.id] = {
    name: newName,
    socket: socket,
  };
  this.clientIds[newName] = newClient.id;
  return newClient.id;
};

ClientList.prototype.remove = function(guid) {
  if (!this.clientInfo[guid]) {
    console.log('could not remove client', guid);
    return;
  }

  delete this.clientIds[this.clientInfo[guid].name];
  delete this.clientInfo[guid];
};

ClientList.prototype.send = function(recipientId, message) {
  var recipient = this.clientInfo[recipientId];
  if (!recipient || !recipient.socket) {
    console.log('unable to send to recipient', recipientId);
    return;
  }

  recipient.socket.send(message);
};

ClientList.prototype.generateName = function() {
  return `Player_${++this.clientCount}`;
};

ClientList.prototype.isEligibleName = function(name) {
  return name && !this.clientIds[name];
};

ClientList.prototype.getName = function(guid) {
  if (guid === undefined || guid === '' || !this.clientInfo[guid]) {
    return '---';
  }

  return this.clientInfo[guid].name;
};

ClientList.prototype.setName = function(guid, name) {
  if (!this.clientInfo[guid] || this.clientIds[name]) {
    return false;
  }

  // Remove old name.
  delete this.clientIds[this.clientInfo[guid]];
  this.clientInfo[guid].name = name;
  this.clientIds[name] = guid;
  return true;
};

ClientList.prototype.getIdList = function() {
  return Object.keys(this.clientInfo);
};

ClientList.prototype.getNameList = function() {
  return Object.keys(this.clientIds);
};

module.exports = ClientList;
