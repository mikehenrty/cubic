window.Socket = (function() {
  'use strict';

  // TODO: configure this for local, dev, and prod somehow.
  const WS_PORT = 8022;
  const WS_HOST = 'ws://' + window.location.hostname + ':' + WS_PORT;

  function Socket() {
    this.ws = null;
  }

  Socket.prototype = new Eventer();

  Socket.prototype._ensureSocket = function() {
    if (this.ws) {
      return Promise.resolve();
    }

    return new Promise((res, rej) => {
      this.ws = new WebSocket(WS_HOST);
      this.ws.addEventListener('message', this._onMessage.bind(this));
      this.ws.addEventListener('open', () => {
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
    args.unshift(type);
    this.trigger.apply(this, args);
  };

  Socket.prototype.send = function(type, recipient, payload) {
    return this._ensureSocket().then(() => {
      recipient = recipient || '';
      payload = payload || '';
      this.ws.send(`${type} ${recipient} ${payload}`);
    });
  };

  Socket.prototype.sendCommand = function(command, recipient, payload) {
    return new Promise((res, rej) => {
      this.on(`${command}_ack`,
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

  Socket.prototype.connectToServer = function(name) {
    if (this.initialized) {
      return Promise.resolve();
    }

    return this.sendCommand('register', null, name).then(
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
