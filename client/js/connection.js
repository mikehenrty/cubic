window.Connection = (function() {
  'use strict';

  function Connection() {
    this.clientId = null;
    this.socket = new Socket();
    this.webRTC = null;
  }

  Connection.prototype.init = function() {
    return this.socket.init().then((clientId) => {
      this.clientId = clientId;
      this.webRTC = new WebRTC(this.clientId, this.socket);
      return clientId;
    });
  };

  Connection.prototype.connect = function(peerId) {
    return new Promise((res, rej) => {
      return this.webRTC.connect(peerId, err => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      });
    });
  };

  Connection.prototype.listen = function() {
    return new Promise((res, rej) => {
      this.webRTC.onConnnection((err, peerId) => {
        if (err) {
          rej(err);
        } else {
          res(peerId);
        }
      });
    });
  };

  return Connection;
})();
