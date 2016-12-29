'use strict';

var Utility = require('./utility.js');

var clientCount = 0;

function Client(nicename) {
  this.id = Utility.guid();
  this.name = nicename;
}

function ClientList() {
  this.clientCount = 0;
  this.clientInfo = {};
  this.clientIds = {};
}

ClientList.prototype.exists = function(clientId) {
  return !!this.clientInfo[clientId];
};

ClientList.prototype.add = function(socket, nicename) {
  var newName = this.isEligibleName(nicename) ?
    nicename : this.generateNicename();
  var newClient = new Client(newName);

  this.clientInfo[newClient.id] = {
    name: newName,
    socket: socket,
  };
  this.clientIds[newName] = newClient.id;
  return newClient.id;
};

ClientList.prototype.remove = function(guid) {
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

ClientList.prototype.generateNicename = function() {
  return `Player_${++this.clientCount}`;
};

ClientList.prototype.isEligibleName = function(nicename) {
  return nicename && !this.clientIds[nicename];
};

ClientList.prototype.getNicename = function(guid) {
  if (guid === undefined || guid === '' || !this.clientInfo[guid]) {
    return '---';
  }

  return this.clientInfo[guid].name;
};

ClientList.prototype.setNicename = function(guid, name) {
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
