window.Connection = (function() {
  'use strict';

  const FAKE_LATENCY = CONST.FAKE_LATENCY;

  function Connection() {
    this.socket = new Socket();
    this.webRTC = new WebRTC(this.socket);
  }

  Connection.prototype = new Eventer();

  Connection.prototype.isConnected = function() {
    return this.webRTC && this.webRTC.isConnected();
  };

  Connection.prototype.register = function(name) {
    return this.socket.sendCommand('register', null, name).then(payload => {
      var parts = payload.split(' ');
      return {
        clientId: parts[0],
        clientName: parts[1]
      };
    });
  };

  Connection.prototype.connectToPeer = function(peerId) {
    this.webRTC.connect(peerId);
  };

  Connection.prototype.on = function(type, cb) {
    // Forward all connection handlers to webRTC events.
    this.webRTC.on(type, cb);
  };

  Connection.prototype.getList = function() {
    return this.socket.sendCommand('list').then(listData => {
      return JSON.parse(listData);
    });
  };

  Connection.prototype.setName = function(name) {
    return this.socket.sendCommand('setname', null, name).then(() => {
      this.clientName = name;
      return name;
    });
  };

  Connection.prototype.send = function(type, payload) {
    if (!this.webRTC.isConnected()) {
      console.log('cannot send message, p2p not connected');
      return;
    }
    if (FAKE_LATENCY) {
      setTimeout(this.webRTC.send.bind(this.webRTC, type, payload),
                 FAKE_LATENCY);
      return;
    }
    this.webRTC.send(type, payload);
  };

  return Connection;
})();
