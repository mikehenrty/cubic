window.Socket = (function() {
  'use strict';

  const WS_PORT = 8022;
  const WS_HOST = 'ws://' + window.location.hostname + ':' + WS_PORT;

  function Socket() {
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
    error = error ? `could not complete ${type}` : null;
    args.unshift(error);
    this.handlers[type] && this.handlers[type].forEach(handler => {
      handler.apply(null, args);
    });
  };

  Socket.prototype.send = function(type, recipient, payload) {
    return this._ensureSocket().then(() => {
      recipient = recipient || '';
      payload = payload || '';
      this.socket.send(`${type} ${recipient} ${payload}`);
    });
  };

  Socket.prototype.registerHandler = function(type, cb) {
    if (!this.handlers[type]) {
      this.handlers[type] = [];
    }
    this.handlers[type].push(cb);
  };

  Socket.prototype.sendCommand = function(command, recipient, payload) {
    return new Promise((res, rej) => {
      this.registerHandler(`${command}_ack`,
                           // Note: memory leak for every command.
                           Utility.once((err, sender, payload) => {
        if (err) {
          rej(err);
        } else if (recipient && recipient !== sender) {
          console.log('ack unrecognized peer', recipient, sender, command);
          rej(new Error(`sendMessage ack from unrecognized peer ${sender}`));
        } else {
          res(payload);
        }
      }));

      this.send(command, recipient, payload);
    });
  };

  Socket.prototype.init = function(suggestedNicename) {
    if (this.initialized) {
      return Promise.resolve();
    }

    return this.sendCommand('register', null, suggestedNicename).then(
      (payload) => {
        this.initialized = true;
        var parts = payload.split(' ');
        return {
          clientId: parts[0],
          clientName: parts[1]
        };
      });
  };

  return Socket;
})();
