window.Connection = (function() {
  'use strict';

  const FAKE_LATENCY = CONST.FAKE_LATENCY;

  function Connection() {
    this.clientId = null;
    this.socket = new Socket();
    this.webRTC = null;
    this.connectionHandler = null;
  }

  Connection.prototype.onPeerConnect = function(cb) {
    this.connectionHandler = cb;
  };

  Connection.prototype.isConnected = function() {
    return this.webRTC && this.webRTC.isConnected();
  };

  Connection.prototype.init = function() {
    return this.socket.init().then(clientData => {
      this.clientId = clientData.clientId;
      this.clientName = clientData.clientName;
      this.webRTC = new WebRTC(this.clientId, this.socket);
      this.webRTC.onConnnection((err, peerId) => {
        if (!err) {
          this.connectionHandler && this.connectionHandler(peerId);
        }
      });
      return this.clientId;
    });
  };

  Connection.prototype.connect = function(peerId) {
    return new Promise((res, rej) => {
      this.webRTC.connect(peerId, err => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      });
    });
  };

  Connection.prototype.registerHandler = function(type, cb) {
    this.webRTC.registerHandler(type, cb);
  };

  Connection.prototype.getList = function() {
    return this.socket.sendCommand('list').then(listData => {
      return JSON.parse(listData);
    });
  };

  Connection.prototype.setName = function(name) {
    return this.socket.setName(name).then(() => {
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
