window.Socket = (function() {
  'use strict';

  const WS_PORT = 8022;
  const WS_HOST = 'ws://' + window.location.hostname + ':' + WS_PORT;

  function Socket() {
    this.clientId = null;
    this.socket = null;
    this.initialized = false;
    this.handlers = {};
  }

  Socket.prototype._ensureSocket = function(cb) {
    if (this.socket) {
      return Promise.resolve();
    }

    return new Promise((res, rej) => {
      this.socket = new WebSocket(WS_HOST);
      this.socket.addEventListener('message', this._onMessage.bind(this));
      this.socket.addEventListener('open', () => {
        res();
      });
    });
  };

  Socket.prototype._onMessage = function(evt) {
    var parts = evt.data.split(' ');
    var error = null;
    if (parts[0] === 'error') {
      error = parts.shift();
    }
    var type = parts.shift();
    var sender = parts.shift();
    var payload = parts.join(' ');
    var args = [sender, payload];
    error = error ? `could not complete ${payload}` : null;
    args.unshift(error);
    this.handlers[type] && this.handlers[type].forEach(handler => {
      handler.apply(null, args);
    });
  };

  Socket.prototype.send = function(type, recipient, payload, cb) {
    return this._ensureSocket().then(() => {
      recipient = recipient || '';
      payload = payload || '';
      this.socket.send(`${type} ${this.clientId} ${recipient} ${payload}`);
    });
  };

  Socket.prototype.registerHandler = function(type, cb) {
    if (!this.handlers[type]) {
      this.handlers[type] = [];
    }
    this.handlers[type].push(cb);
  };

  Socket.prototype.sendRegister = function() {
    return new Promise((res, rej) => {
      this.registerHandler('register_ack', (err, message) => {
        if (err) {
          return rej(err);
        }
        this.clientId = message;
        res(this.clientId);
      });
      this.send('register');
    });
  };

  Socket.prototype.init = function() {
    if (this.initialized) {
      return Promise.resolve();
    }

    return this.sendRegister().then(clientId => {
      this.initialized = true;
      return clientId;
    });
  };

  return Socket;
})();