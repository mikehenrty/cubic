'use strict';

var Utility = require('./utility.js');

var clientCount = 0;

function Client(id, name) {
  this.id = id;
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

ClientList.prototype.add = function(socket, id) {
  id = this.isEligibleId(id) ? id : Utility.guid();
  var newClient = new Client(id, this.generateName());

  this.clientInfo[newClient.id] = {
    name: newClient.name,
    socket: socket,
  };
  this.clientIds[newClient.name] = newClient.id;
  return newClient;
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

ClientList.prototype.isEligibleId = function(id) {
  return id && !this.clientInfo[id];
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
  delete this.clientIds[this.clientInfo[guid].name];
  this.clientInfo[guid].name = name;
  this.clientIds[name] = guid;
  return true;
};

ClientList.prototype.getIdList = function() {
  return Object.keys(this.clientInfo);
};

ClientList.prototype.printList = function() {
  console.log('LIST:');
  Object.keys(this.clientIds).forEach(name => {
    var id = this.clientIds[name];
    console.log('--', name, id.substr(0, id.indexOf('-')));
  });
  console.log('');
};

module.exports = ClientList;
