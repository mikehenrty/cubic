window.Connection = (function() {
  'use strict';

  function Connection() {
    this.clientId = null;
    this.socket = new Socket();
    this.webRTC = null;
  }

  Connection.prototype.onPeerConnect = function(cb) {
    this.webRTC.onConnnection((err, peerId) => {
      if (!err) {
        cb(peerId);
      }
    });
  };

  Connection.prototype.init = function() {
    return this.socket.init().then((clientId) => {
      this.clientId = clientId;
      this.webRTC = new WebRTC(this.clientId, this.socket);
      return clientId;
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

  return Connection;
})();
