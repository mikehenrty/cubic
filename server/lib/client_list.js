'use strict';

var Utility = require('./utility.js');

var clientCount = 0;

function ClientList() {
  this.clientCount = 0;
  this.clientInfo = {};
}

ClientList.prototype.exists = function(clientId) {
  return !!this.clientInfo[clientId];
};

ClientList.prototype.add = function(socket, id) {
  id = this.isEligibleId(id) ? id : Utility.guid();
  var info = {
    id: id,
    name: this.generateName(), // TODO: get this from storage
    status: '',
    socket: socket,
  };
  this.clientInfo[id] = info;
  return info;
};

ClientList.prototype.remove = function(guid) {
  if (!this.clientInfo[guid]) {
    console.log('could not remove client', guid);
    return;
  }

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
  if (!this.clientInfo[guid]) {
    return false;
  }

  // TODO: Check that name doesn't already exists.

  // Remove old name.
  this.clientInfo[guid].name = name;
  return true;
};

ClientList.prototype.setStatus = function(guid, status) {
  if (!this.clientInfo[guid]) {
    return false;
  }

  this.clientInfo[guid].status = status;
  return true;
};

ClientList.prototype.getIdList = function() {
  return Object.keys(this.clientInfo);
};

ClientList.prototype.getSocketList = function() {
  return this.getIdList().map(id => {
    return this.clientInfo[id].socket;
  });
};

ClientList.prototype.getListAsString = function() {
  return JSON.stringify(this.getIdList().map((clientId) => {
    var info = this.clientInfo[clientId];
    return {
      clientId: info.id,
      clientName: info.name,
      clientStatus: info.status,
    };
  }));
};

ClientList.prototype.printList = function() {
  console.log('LIST:');
  this.getIdList().forEach(id => {
    console.log('--', this.clientInfo[id].name, id.substr(0, id.indexOf('-')));
  });
  console.log('');
};

module.exports = ClientList;
